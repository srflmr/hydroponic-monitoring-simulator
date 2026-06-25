import os

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .mqtt_handler import ActuatorGateway

gateway = ActuatorGateway()

app = FastAPI()


@app.get("/health")
def health():
    if gateway.connected:
        return {"status": "ok"}
    return JSONResponse(status_code=503, content={"status": "unavailable"})


def start():
    gateway.start()


if os.environ.get("MQTT_BROKER_URL"):
    start()
