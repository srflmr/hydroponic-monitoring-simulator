import heapq
import json
import os
import threading
import uuid
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import db, tank_manager
from .arbitration import build_reason, plan_decisions
from .scoring import calculate_score, compute_criticality
from .tank_utils import clamp_volume
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


def _publish_command(zone_id, request_id, volume, decided_at):
    topic = f"hydroponic/{zone_id}/actuator/command"
    payload = {
        "zone_id": zone_id,
        "request_id": request_id,
        "action": "open_valve",
        "volume_liter": volume,
        "decided_at": _iso(decided_at),
    }
    client.publish(topic, json.dumps(payload))


_arb_lock = threading.Lock()
# Single source of truth: one active request per zone.
_pending = {}  # zone_id -> {"request": dict, "score": float, "seq": int, "logged": str | None}
_seq = 0


def _score_request(request: dict) -> float:
    priority = get_zone_priority(request["zone_id"])
    if priority is None:
        priority = 0  # unknown zone -> lowest priority, still scored from criticality
    criticality = compute_criticality(
        float(request["current_value"]), float(request["threshold_min"])
    )
    return calculate_score(priority, criticality, W1, W2)


def _normalize_requested_at(request: dict) -> dict:
    """Ensure requested_at is parseable; if not, use the current time.
    Prevents _parse_iso from raising mid-serve() and making the round non-atomic.
    Empty/falsy values are also replaced with the current time."""
    ra = request.get("requested_at")
    if ra:
        try:
            _parse_iso(ra)
            return request
        except (ValueError, TypeError):
            pass
    return {**request, "requested_at": _iso(_now())}


def _upsert(request: dict, score: float) -> None:
    """Insert/update a zone's active request (latest reading wins). seq and the
    'logged' status are preserved as long as the zone stays pending."""
    global _seq
    zid = request["zone_id"]
    p = _pending.get(zid)
    if p is None:
        _pending[zid] = {"request": request, "score": score, "seq": _seq, "logged": None}
        _seq += 1
    else:
        p["request"] = request
        p["score"] = score


def _ordered_pending() -> list:
    """Build the priority ordering (PRD §13) from _pending via heapq, popped in score order."""
    heap = [(-p["score"], p["seq"], zid) for zid, p in _pending.items()]
    heapq.heapify(heap)
    ordered = []
    while heap:
        _, _, zid = heapq.heappop(heap)
        p = _pending[zid]
        ordered.append(
            {"request": p["request"], "score": p["score"], "already_queued": p["logged"] is not None}
        )
    return ordered


def _emit_event(log_entry: dict, alert: dict | None) -> None:
    payload = {"log": log_entry, "alert": alert, "tank": _tank_snapshot()}
    topic = f"hydroponic/{log_entry['zone_id']}/arbitration/event"
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
        "score": score,
        "tank_volume_after": tank_volume_after,
    }
    alert = None
    if decision == "rejected":
        alert = {"zone_id": request["zone_id"], "message": "Tank needs refilling", "severity": "critical"}
    elif decision == "queued":
        alert = {"zone_id": request["zone_id"], "message": "Tank needs refilling", "severity": "warning"}
    _emit_event(log_entry, alert)


def serve() -> None:
    """Run one decision round over all pending zones. Caller holds _arb_lock."""
    pending = _ordered_pending()
    if not pending:
        return
    volume = tank_manager.get_current_volume()
    plan = plan_decisions(volume, ALLOCATION_VOLUME_LITER, pending)
    top_zone = next(
        (d["request"]["zone_id"] for d in plan["decisions"] if d["decision"] == "fulfilled"), None
    )
    for d in plan["decisions"]:
        req = d["request"]
        zid = req["zone_id"]
        decided_at = _now()
        if d["decision"] == "fulfilled":
            tank_manager.set_volume(d["tank_volume_after"])
            _record(req, "fulfilled", d["score"], d["tank_volume_after"], decided_at)
            _publish_command(zid, req["request_id"], ALLOCATION_VOLUME_LITER, decided_at)
            print(
                f"resource-arbitration: decision zone={zid} request={req['request_id']} "
                f"decision=fulfilled score={d['score']:.3f} tank_after={d['tank_volume_after']}",
                flush=True,
            )
            _pending.pop(zid, None)
        else:  # queued / rejected -> stays pending, retried next round (incl. on refill)
            p = _pending.get(zid)
            # First unserved decision per episode wins the label; later transitions don't re-log.
            if p is not None and p["logged"] is None:
                _record(req, d["decision"], d["score"], None, decided_at, top_zone=top_zone)
                p["logged"] = d["decision"]
                print(
                    f"resource-arbitration: decision zone={zid} request={req['request_id']} "
                    f"decision={d['decision']} score={d['score']:.3f}",
                    flush=True,
                )


def intake(requests: list) -> None:
    """Score an incoming batch of requests, upsert per zone, then run one serve() round."""
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
            request = _normalize_requested_at(request)
            score = _score_request(request)
            _upsert(request, score)
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
    with _arb_lock:
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
def logs(limit: int = Query(default=50, ge=1, le=500), offset: int = Query(default=0, ge=0)):
    return db.get_logs(limit, offset)


class RefillBody(BaseModel):
    amount: float | None = Field(default=None, ge=0)


class RequestBody(BaseModel):
    zone_id: str
    current_value: float
    threshold_min: float
    request_id: str | None = None
    requested_at: str | None = None


@app.post("/tank/refill")
def tank_refill(body: RefillBody):
    with _arb_lock:
        capacity = tank_manager.get_capacity()
        current = tank_manager.get_current_volume()
        target = max(0.0, capacity if body.amount is None else min(capacity, round(current + body.amount, 2)))
        tank_manager.set_volume(target)
        serve()
    return tank_status()


class SetVolumeBody(BaseModel):
    volume: float = Field(ge=0)


@app.post("/tank/set")
def tank_set(body: SetVolumeBody):
    with _arb_lock:
        target = clamp_volume(body.volume, tank_manager.get_capacity())
        tank_manager.set_volume(target)
        serve()
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
        items = sorted(
            (
                {"request_id": p["request"]["request_id"], "zone_id": zid, "score": p["score"]}
                for zid, p in _pending.items()
            ),
            key=lambda x: x["score"],
            reverse=True,
        )
    return {"pending": items, "total": len(items)}


def start():
    db.init()
    tank_manager.init_from_postgres()
    host, port = _broker_host_port(MQTT_BROKER_URL)
    client.username_pw_set(os.environ["MQTT_USERNAME"], os.environ["MQTT_PASSWORD"])
    client.connect(host, port, keepalive=60)
    client.loop_start()
    threading.Thread(target=_consume_loop, daemon=True).start()


if os.environ.get("ARBITRATION_AUTOSTART", "1") != "0":
    start()
