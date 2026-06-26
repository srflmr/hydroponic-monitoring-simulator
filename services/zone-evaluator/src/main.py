import json
import os
import threading
import uuid
from datetime import datetime, timezone

import redis
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .evaluator import evaluate_reading
from .zone_config_client import get_thresholds, ping as zone_config_ping

REDIS_URL = os.environ["REDIS_URL"]
TELEMETRY_QUEUE = "queue:telemetry_for_evaluation"
RESOURCE_QUEUE = "queue:resource_requests"

r = redis.from_url(REDIS_URL, decode_responses=True)

_last_eval = {}  # zone_id -> evaluation dict
_lock = threading.Lock()


def _now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _make_request(reading, threshold_min):
    return {
        "request_id": f"req-{uuid.uuid4().hex[:8]}",
        "zone_id": reading["zone_id"],
        "param_violated": "ec",
        "current_value": reading.get("ec"),
        "threshold_min": threshold_min,
        "requested_at": _now_iso(),
    }


def _process(reading):
    zone_id = reading.get("zone_id")
    if zone_id is None:
        return
    thresholds = get_thresholds(zone_id)
    if thresholds is None:
        return
    result = evaluate_reading(reading, thresholds)
    with _lock:
        _last_eval[zone_id] = {
            "zone_id": zone_id,
            "last_reading": {
                k: reading.get(k) for k in ("ph", "ec", "water_temp_c", "water_level_pct")
            },
            "status": result["status"],
            "violated_params": result["violated_params"],
            "evaluated_at": _now_iso(),
        }
    ec = reading.get("ec")
    if ec is not None and ec < thresholds["ec_min"]:
        request = _make_request(reading, thresholds["ec_min"])
        r.lpush(RESOURCE_QUEUE, json.dumps(request))


def _consume_loop():
    while True:
        item = r.brpop(TELEMETRY_QUEUE, timeout=5)
        if item is None:
            continue
        _, raw = item
        try:
            reading = json.loads(raw)
        except json.JSONDecodeError:
            continue
        try:
            _process(reading)
        except Exception as err:
            print(f"zone-evaluator: failed to process reading: {err}", flush=True)
            continue


app = FastAPI()


@app.get("/health")
def health():
    try:
        r.ping()
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    if not zone_config_ping():
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ok"}


@app.get("/zones/{zone_id}/current")
def current(zone_id: str):
    with _lock:
        data = _last_eval.get(zone_id)
    if data is None:
        return JSONResponse(
            status_code=404,
            content={"error": "no_evaluation", "message": "Belum ada evaluasi"},
        )
    return data


def start():
    threading.Thread(target=_consume_loop, daemon=True).start()


start()
