import json
import os
import threading
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from . import db, tank_manager
from .arbitration import decide_allocation

MQTT_BROKER_URL = os.environ["MQTT_BROKER_URL"]
RESOURCE_QUEUE = "queue:resource_requests"
ALLOCATION_VOLUME_LITER = float(os.environ.get("ALLOCATION_VOLUME_LITER", "5"))

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


def _process(request):
    zone_id = request.get("zone_id")
    request_id = request.get("request_id")
    if zone_id is None or request_id is None:
        return

    current_volume = tank_manager.get_current_volume()
    result = decide_allocation(current_volume, ALLOCATION_VOLUME_LITER)
    decided_at = _now()
    raw_requested_at = request.get("requested_at")
    requested_at = _parse_iso(raw_requested_at) if raw_requested_at else decided_at

    if result["decision"] == "fulfilled":
        tank_manager.set_volume(result["new_volume"])
        tank_volume_after = result["new_volume"]
    else:
        tank_volume_after = None

    db.insert_log(
        {
            "request_id": request_id,
            "zone_id": zone_id,
            "requested_at": requested_at,
            "decision": result["decision"],
            "reason": result["reason"],
            "score": None,
            "volume_requested": ALLOCATION_VOLUME_LITER,
            "tank_volume_after": tank_volume_after,
            "decided_at": decided_at,
        }
    )

    if result["decision"] == "fulfilled":
        _publish_komando(zone_id, request_id, ALLOCATION_VOLUME_LITER, decided_at)


def _consume_loop():
    while True:
        item = tank_manager.brpop(RESOURCE_QUEUE, timeout=5)
        if item is None:
            continue
        _, raw = item
        try:
            request = json.loads(raw)
        except json.JSONDecodeError:
            continue
        try:
            _process(request)
        except Exception as err:
            print(f"resource-arbitration: failed to process request: {err}", flush=True)
            continue


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


def start():
    tank_manager.init_from_postgres()
    host, port = _broker_host_port(MQTT_BROKER_URL)
    client.connect(host, port, keepalive=60)
    client.loop_start()
    threading.Thread(target=_consume_loop, daemon=True).start()


if os.environ.get("MQTT_BROKER_URL"):
    start()
