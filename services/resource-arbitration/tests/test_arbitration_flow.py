import os

os.environ.setdefault("MQTT_BROKER_URL", "mqtt://localhost:1883")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("POSTGRES_URL", "postgresql://t:t@localhost:5432/t")
os.environ.setdefault("ZONE_CONFIG_URL", "http://localhost:3003")
os.environ["ARBITRATION_AUTOSTART"] = "0"

import pytest

from src import main  # noqa: E402


def test_main_imports_without_autostart():
    assert hasattr(main, "app")
    assert hasattr(main, "serve")
    assert main._pending == {}
    assert not main._connected.is_set()


def _req(zone, rid, current=1.0, thr=1.5, ts="2026-06-27T00:00:00Z"):
    return {"request_id": rid, "zone_id": zone, "current_value": current,
            "threshold_min": thr, "requested_at": ts}


@pytest.fixture
def engine(monkeypatch):
    main._pending.clear()
    main._seq = 0
    vol = {"v": 0.0}
    records = []
    monkeypatch.setattr(main.tank_manager, "get_current_volume", lambda: vol["v"])
    monkeypatch.setattr(main.tank_manager, "set_volume", lambda nv: vol.__setitem__("v", nv))
    monkeypatch.setattr(main.db, "insert_log",
                        lambda entry: (records.append(entry), f"log-{len(records)}")[1])
    monkeypatch.setattr(main, "_emit_event", lambda log_entry, alert: None)
    monkeypatch.setattr(main, "get_zone_priority", lambda zid: 5)
    return {"vol": vol, "records": records}


def test_queued_request_served_after_refill(engine):
    engine["vol"]["v"] = 5.0  # tepat satu alokasi -> satu fulfilled, satu queued
    main.intake([_req("zone-a", "a1", current=1.0), _req("zone-b", "b1", current=0.5)])
    decisions = [r["decision"] for r in engine["records"]]
    assert "fulfilled" in decisions and "queued" in decisions
    assert len(main._pending) == 1  # zona yang kalah tetap pending
    engine["records"].clear()
    engine["vol"]["v"] = 200.0  # refill
    with main._arb_lock:
        main.serve()
    assert main._pending == {}  # zona ter-queue kini dilayani
    assert [r["decision"] for r in engine["records"]] == ["fulfilled"]


def test_pending_bounded_per_zone(engine):
    engine["vol"]["v"] = 0.0  # tangki kering -> tak ada yang dilayani
    for i in range(20):
        main.intake([_req("zone-b", f"b{i}", current=0.5)])
    assert len(main._pending) == 1  # satu entri per zona, tak bocor
    assert "zone-b" in main._pending


def test_queued_logged_once_per_episode(engine):
    engine["vol"]["v"] = 0.0
    for i in range(5):
        main.intake([_req("zone-b", f"b{i}", current=0.5)])
    unserved = [r for r in engine["records"] if r["decision"] in ("queued", "rejected")]
    assert len(unserved) == 1  # hanya satu log untuk satu episode
    assert engine["records"][0]["decision"] == "rejected"


def test_invalid_requested_at_keeps_round_atomic(engine):
    engine["vol"]["v"] = 200.0
    # requested_at rusak tidak boleh meledak di tengah serve; request tetap diproses
    main.intake([_req("zone-a", "a1", ts="bukan-tanggal")])
    assert [r["decision"] for r in engine["records"]] == ["fulfilled"]
    assert engine["records"][0]["requested_at"]
    assert main._pending == {}


def test_empty_requested_at_still_fulfilled(engine):
    engine["vol"]["v"] = 200.0
    main.intake([_req("zone-a", "a1", ts="")])
    assert [r["decision"] for r in engine["records"]] == ["fulfilled"]
    assert main._pending == {}


def test_get_tank_missing_seed_raises_clear_error(monkeypatch):
    class _FakeConn:
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def execute(self, *a, **k):
            class _Cur:
                def fetchone(self_inner): return None
            return _Cur()
    monkeypatch.setattr(main.db.pool, "connection", lambda: _FakeConn())
    with pytest.raises(RuntimeError, match="tank_status"):
        main.db.get_tank()


def test_tank_status_reads_consistent_snapshot(engine, monkeypatch):
    monkeypatch.setattr(main.tank_manager, "get_capacity", lambda: 200.0)
    engine["vol"]["v"] = 50.0
    body = main.tank_status()
    assert body["current_volume"] == 50.0
    assert body["capacity"] == 200.0
    assert body["percentage"] == 25.0
