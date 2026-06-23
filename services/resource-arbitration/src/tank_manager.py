import os

import redis

from . import db

REDIS_URL = os.environ["REDIS_URL"]
TANK_VOLUME_KEY = "tank:current_volume"

r = redis.from_url(REDIS_URL, decode_responses=True)

_capacity = None  # cached after init_from_postgres()


def init_from_postgres() -> None:
    """Seed the Redis cache from the Postgres source of truth at startup."""
    global _capacity
    tank = db.get_tank()
    _capacity = tank["capacity"]
    r.set(TANK_VOLUME_KEY, tank["current_volume"])


def get_current_volume() -> float:
    cached = r.get(TANK_VOLUME_KEY)
    if cached is not None:
        return float(cached)
    # Cache miss (e.g. Redis restarted) — repopulate from Postgres.
    tank = db.get_tank()
    r.set(TANK_VOLUME_KEY, tank["current_volume"])
    return tank["current_volume"]


def get_capacity() -> float:
    if _capacity is None:
        return db.get_tank()["capacity"]
    return _capacity


def set_volume(new_volume: float) -> None:
    """Write-through: update the Postgres source of truth first, then the Redis
    cache. If the Postgres write fails, the cache is left untouched so it never
    leads the source of truth."""
    db.update_tank_volume(new_volume)
    r.set(TANK_VOLUME_KEY, new_volume)


def ping() -> None:
    r.ping()


def brpop(key: str, timeout: int):
    return r.brpop(key, timeout=timeout)
