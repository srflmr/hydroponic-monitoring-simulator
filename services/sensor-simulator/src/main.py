import json
import os
import threading
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .random_walk import PARAM_BOUNDS, next_value

ZONE_ID = os.environ["ZONE_ID"]
DEVICE_ID = os.environ.get("DEVICE_ID", "sensor-01")
MQTT_BROKER_URL = os.environ["MQTT_BROKER_URL"]
PUBLISH_INTERVAL_SECONDS = float(os.environ.get("PUBLISH_INTERVAL_SECONDS", "4"))

PARAMS = ["ph", "ec", "water_temp_c", "water_level_pct"]

_state = {
    "ph": float(os.environ.get("INIT_PH", "6.0")),
    "ec": float(os.environ.get("INIT_EC", "1.8")),
    "water_temp_c": float(os.environ.get("INIT_WATER_TEMP_C", "25.0")),
    "water_level_pct": float(os.environ.get("INIT_WATER_LEVEL_PCT", "90.0")),
}
_overrides = {}  # param -> {"value": float, "expires_at": float | None}
_lock = threading.Lock()
_connected = threading.Event()


def _broker_host_port(url: str):
    without_scheme = url.split("://", 1)[-1]
    host, _, port = without_scheme.partition(":")
    return host, int(port or "1883")


client = mqtt.Client(client_id=f"sensor-simulator-{ZONE_ID}")


def _on_connect(c, userdata, flags, rc):
    if rc == 0:
        _connected.set()


client.on_connect = _on_connect


def _now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _current_reading():
    with _lock:
        now = time.time()
        reading = {}
        for param in PARAMS:
            override = _overrides.get(param)
            if override and (override["expires_at"] is None or override["expires_at"] > now):
                value = override["value"]
                if override["expires_at"] is None:
                    del _overrides[param]  # one-shot override
            else:
                if override:
                    del _overrides[param]  # expired
                value = next_value(param, _state[param])
                _state[param] = value
            reading[param] = round(value, 2)
        return reading


def _publish_loop():
    host, port = _broker_host_port(MQTT_BROKER_URL)
    client.connect(host, port, keepalive=60)
    client.loop_start()
    topic = f"hydroponic/{ZONE_ID}/sensor/reading"
    while True:
        reading = _current_reading()
        payload = {"zone_id": ZONE_ID, "device_id": DEVICE_ID, "timestamp": _now_iso(), **reading}
        client.publish(topic, json.dumps(payload))
        time.sleep(PUBLISH_INTERVAL_SECONDS)


app = FastAPI()


class SimulateBody(BaseModel):
    param: str
    value: float
    duration_seconds: float | None = None


@app.get("/health")
def health():
    if _connected.is_set():
        return {"status": "ok"}
    return JSONResponse(status_code=503, content={"status": "unavailable"})


@app.post("/simulate")
def simulate(body: SimulateBody):
    if body.param not in PARAM_BOUNDS:
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_param", "message": "Parameter tidak dikenal"},
        )
    low, high = PARAM_BOUNDS[body.param]
    value = max(low, min(high, body.value))  # clamp to the sensor's physical range
    with _lock:
        expires_at = time.time() + body.duration_seconds if body.duration_seconds is not None else None
        _overrides[body.param] = {"value": value, "expires_at": expires_at}
    return {"status": "accepted", "param": body.param, "value": value}


def start():
    threading.Thread(target=_publish_loop, daemon=True).start()


if os.environ.get("ZONE_ID"):
    start()
