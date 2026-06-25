import heapq
import json
import os
import threading
import uuid
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from . import db, tank_manager
from .arbitration import build_reason, plan_decisions
from .scoring import calculate_score, compute_criticality
from .zone_config_client import get_zone_priority

MQTT_BROKER_URL = os.environ["MQTT_BROKER_URL"]
RESOURCE_QUEUE = "queue:resource_requests"
ALLOCATION_VOLUME_LITER = float(os.environ.get("ALLOCATION_VOLUME_LITER", "5"))
W1 = float(os.environ.get("ARBITRATION_W1", "0.4"))
W2 = float(os.environ.get("ARBITRATION_W2", "0.6"))

_connected = threading.Event()


def _broker_host_port(url: str):
    without_scheme = url.split("://", 1)[-1]
    host, _, port = without_scheme.partition(":")
    return host, int(port or "1883")


client = mqtt.Client(client_id="resource-arbitration")


def _on_connect(c, userdata, flags, rc):
    if rc == 0:
        _connected.set()


def _on_disconnect(c, userdata, rc):
    _connected.clear()


client.on_connect = _on_connect
client.on_disconnect = _on_disconnect


def _now():
    return datetime.now(timezone.utc)


def _iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _publish_komando(zone_id, request_id, volume, decided_at):
    topic = f"hydroponic/{zone_id}/aktuator/komando"
    payload = {
        "zone_id": zone_id,
        "request_id": request_id,
        "action": "open_valve",
        "volume_liter": volume,
        "decided_at": _iso(decided_at),
    }
    client.publish(topic, json.dumps(payload))


_arb_lock = threading.Lock()
_heap = []          # (neg_score, seq, request_id)
_requests = {}      # request_id -> {**request, "score": float}
_queued_ids = set()  # request_ids already logged as queued
_seq = 0


def _score_request(request: dict) -> float:
    priority = get_zone_priority(request["zone_id"])
    if priority is None:
        priority = 0  # unknown zone -> lowest priority, still scored on criticality
    criticality = compute_criticality(
        float(request["current_value"]), float(request["threshold_min"])
    )
    return calculate_score(priority, criticality, W1, W2)


def _enqueue(request: dict, score: float) -> None:
    global _seq
    rid = request["request_id"]
    _requests[rid] = {**request, "score": score}
    heapq.heappush(_heap, (-score, _seq, rid))
    _seq += 1


def _drain_heap() -> list:
    """Pop all heap entries into a score-ordered list of pending {request, score, already_queued}."""
    pending = []
    while _heap:
        neg_score, _, rid = heapq.heappop(_heap)
        req = _requests.get(rid)
        if req is None:
            continue
        pending.append({"request": req, "score": req["score"], "already_queued": rid in _queued_ids})
    return pending


def _emit_event(log_entry: dict, alert: dict | None) -> None:
    payload = {"log": log_entry, "alert": alert, "tank": _tank_snapshot()}
    topic = f"hydroponic/{log_entry['zone_id']}/arbitrasi/event"
    client.publish(topic, json.dumps(payload))


def _tank_snapshot() -> dict:
    current = tank_manager.get_current_volume()
    capacity = tank_manager.get_capacity()
    percentage = round(current / capacity * 100, 2) if capacity else 0.0
    return {"current_volume": current, "capacity": capacity, "percentage": percentage}


def _record(request: dict, decision: str, score, tank_volume_after, decided_at, top_zone=None):
    requested_at = request.get("requested_at")
    requested_dt = _parse_iso(requested_at) if requested_at else decided_at
    reason = build_reason(
        decision, score, request.get("current_value"), request.get("threshold_min"), top_zone
    )
    entry = {
        "request_id": request["request_id"],
        "zone_id": request["zone_id"],
        "requested_at": requested_dt,
        "decision": decision,
        "reason": reason,
        "score": score,
        "volume_requested": ALLOCATION_VOLUME_LITER,
        "tank_volume_after": tank_volume_after,
        "decided_at": decided_at,
    }
    log_id = db.insert_log(entry)
    log_entry = {
        "id": log_id,
        "zone_id": request["zone_id"],
        "requested_at": _iso(requested_dt),
        "decision": decision,
        "reason": reason,
        "tank_volume_after": tank_volume_after,
    }
    alert = None
    if decision == "rejected":
        alert = {"zone_id": request["zone_id"], "message": "Tangki perlu diisi ulang", "severity": "critical"}
    elif decision == "queued":
        alert = {"zone_id": request["zone_id"], "message": "Tangki perlu diisi ulang", "severity": "warning"}
    _emit_event(log_entry, alert)


def serve() -> None:
    """Run a decision round over all pending requests. Caller holds _arb_lock."""
    pending = _drain_heap()
    if not pending:
        return
    volume = tank_manager.get_current_volume()
    plan = plan_decisions(volume, ALLOCATION_VOLUME_LITER, pending)
    top_zone = next(
        (d["request"]["zone_id"] for d in plan["decisions"] if d["decision"] == "fulfilled"), None
    )
    for d in plan["decisions"]:
        req = d["request"]
        rid = req["request_id"]
        decided_at = _now()
        if d["decision"] == "fulfilled":
            tank_manager.set_volume(d["tank_volume_after"])
            _record(req, "fulfilled", d["score"], d["tank_volume_after"], decided_at)
            _publish_komando(req["zone_id"], rid, ALLOCATION_VOLUME_LITER, decided_at)
            _queued_ids.discard(rid)
            _requests.pop(rid, None)
        elif d["decision"] == "queued":
            if rid not in _queued_ids:
                _record(req, "queued", d["score"], None, decided_at, top_zone=top_zone)
                _queued_ids.add(rid)
            _enqueue(req, d["score"])  # keep it pending for the next round
        else:  # rejected
            _record(req, "rejected", d["score"], None, decided_at)
            _queued_ids.discard(rid)
            _requests.pop(rid, None)


def intake(requests: list) -> None:
    """Score a batch of incoming requests, enqueue them, and run a serve round."""
    with _arb_lock:
        for request in requests:
            rid = request.get("request_id")
            zid = request.get("zone_id")
            if zid is None or rid is None:
                print(f"resource-arbitration: skipping request missing zone_id/request_id: {request}", flush=True)
                continue
            try:
                float(request["current_value"])
                float(request["threshold_min"])
            except (KeyError, TypeError, ValueError):
                print(f"resource-arbitration: skipping malformed request {rid!r} zone={zid!r}: invalid current_value/threshold_min", flush=True)
                continue
            score = _score_request(request)
            _enqueue(request, score)
        serve()


def _consume_loop():
    while True:
        item = tank_manager.brpop(RESOURCE_QUEUE, timeout=5)
        if item is None:
            continue
        batch = []
        _, raw = item
        try:
            batch.append(json.loads(raw))
        except json.JSONDecodeError:
            pass
        # Non-blocking drain: batch any requests that arrived together so
        # contention (and therefore `queued`) can occur.
        while True:
            nxt = tank_manager.r.rpop(RESOURCE_QUEUE)
            if nxt is None:
                break
            try:
                batch.append(json.loads(nxt))
            except json.JSONDecodeError:
                continue
        if not batch:
            continue
        try:
            intake(batch)
        except Exception as err:
            print(f"resource-arbitration: failed to process batch: {err}", flush=True)


app = FastAPI()


@app.get("/health")
def health():
    try:
        db.ping()
        tank_manager.ping()
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    if not _connected.is_set():
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ok"}


@app.get("/tank/status")
def tank_status():
    current = tank_manager.get_current_volume()
    capacity = tank_manager.get_capacity()
    percentage = round(current / capacity * 100, 2) if capacity else 0.0
    return {
        "current_volume": current,
        "capacity": capacity,
        "percentage": percentage,
        "updated_at": _iso(_now()),
    }


@app.get("/logs")
def logs(limit: int = 50, offset: int = 0):
    return db.get_logs(limit, offset)


class RefillBody(BaseModel):
    amount: float | None = None


class RequestBody(BaseModel):
    zone_id: str
    current_value: float
    threshold_min: float
    request_id: str | None = None
    requested_at: str | None = None


@app.post("/tank/refill")
def tank_refill(body: RefillBody):
    capacity = tank_manager.get_capacity()
    current = tank_manager.get_current_volume()
    target = capacity if body.amount is None else min(capacity, round(current + body.amount, 2))
    tank_manager.set_volume(target)
    with _arb_lock:
        serve()  # reprocess queued requests in priority order
    return tank_status()


@app.post("/requests", status_code=202)
def submit_request(body: RequestBody):
    request = {
        "request_id": body.request_id or f"req-{uuid.uuid4().hex[:8]}",
        "zone_id": body.zone_id,
        "param_violated": "ec",
        "current_value": body.current_value,
        "threshold_min": body.threshold_min,
        "requested_at": body.requested_at or _iso(_now()),
    }
    intake([request])
    return {"status": "accepted", "request_id": request["request_id"]}


@app.get("/requests/pending")
def pending_requests():
    with _arb_lock:
        items = [
            {"request_id": rid, "zone_id": _requests[rid]["zone_id"], "score": _requests[rid]["score"]}
            for _, _, rid in sorted(_heap)
            if rid in _requests
        ]
    return {"pending": items, "total": len(items)}


def start():
    tank_manager.init_from_postgres()
    host, port = _broker_host_port(MQTT_BROKER_URL)
    client.connect(host, port, keepalive=60)
    client.loop_start()
    threading.Thread(target=_consume_loop, daemon=True).start()


if os.environ.get("MQTT_BROKER_URL"):
    start()
