import json
import os
import threading
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

MQTT_BROKER_URL = os.environ.get("MQTT_BROKER_URL", "")
KOMANDO_TOPIC = "hydroponic/+/aktuator/komando"
SIMULATED_DELAY_SECONDS = float(os.environ.get("ACTUATOR_DELAY_SECONDS", "1.5"))


def _broker_host_port(url: str):
    without_scheme = url.split("://", 1)[-1]
    host, _, port = without_scheme.partition(":")
    return host, int(port or "1883")


def _iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class ActuatorGateway:
    def __init__(self):
        self.client = mqtt.Client(client_id="actuator-gateway")
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
        self.connected = False

    def _on_connect(self, c, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            c.subscribe(KOMANDO_TOPIC)

    def _on_disconnect(self, c, userdata, rc):
        self.connected = False

    def _on_message(self, c, userdata, msg):
        # Handle in a short-lived thread so the simulated delay never blocks
        # the MQTT network loop (keeps heartbeats and other messages flowing).
        threading.Thread(target=self._handle, args=(msg.payload,), daemon=True).start()

    def _handle(self, payload):
        try:
            komando = json.loads(payload.decode())
        except (json.JSONDecodeError, UnicodeDecodeError):
            return
        zone_id = komando.get("zone_id")
        request_id = komando.get("request_id")
        if zone_id is None or request_id is None:
            return
        time.sleep(SIMULATED_DELAY_SECONDS)
        status = {
            "zone_id": zone_id,
            "request_id": request_id,
            "status": "completed",
            "executed_at": _iso_now(),
        }
        self.client.publish(f"hydroponic/{zone_id}/aktuator/status", json.dumps(status))

    def start(self):
        host, port = _broker_host_port(MQTT_BROKER_URL)
        self.client.connect(host, port, keepalive=60)
        self.client.loop_start()
