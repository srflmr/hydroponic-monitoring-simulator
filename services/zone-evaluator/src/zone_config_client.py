import json
import os
import urllib.request

ZONE_CONFIG_URL = os.environ["ZONE_CONFIG_URL"]


def get_thresholds(zone_id: str) -> dict | None:
    """Fetch a zone's thresholds from zone-config. Returns floats, or None on failure."""
    url = f"{ZONE_CONFIG_URL}/zones/{zone_id}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read())
    except Exception:
        return None
    return {
        "ph_min": float(data["ph_min"]),
        "ph_max": float(data["ph_max"]),
        "ec_min": float(data["ec_min"]),
        "ec_max": float(data["ec_max"]),
        "temp_min": float(data["temp_min"]),
        "temp_max": float(data["temp_max"]),
    }


def ping() -> bool:
    """True if zone-config answers /health within the timeout."""
    try:
        with urllib.request.urlopen(f"{ZONE_CONFIG_URL}/health", timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False
