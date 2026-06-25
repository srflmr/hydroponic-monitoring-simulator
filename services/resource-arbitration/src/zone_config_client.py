import json
import os
import time
import urllib.request

ZONE_CONFIG_URL = os.environ["ZONE_CONFIG_URL"]
_cache = {}  # zone_id -> (priority, expires_at)
_TTL_SECONDS = 30


def get_zone_priority(zone_id: str) -> int | None:
    """Fetch a zone's priority from zone-config (cached 30s). None on failure."""
    now = time.time()
    cached = _cache.get(zone_id)
    if cached and cached[1] > now:
        return cached[0]
    url = f"{ZONE_CONFIG_URL}/zones/{zone_id}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read())
        priority = int(data["priority"])
    except Exception:
        return cached[0] if cached else None
    _cache[zone_id] = (priority, now + _TTL_SECONDS)
    return priority
