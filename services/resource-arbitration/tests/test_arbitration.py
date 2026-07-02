from src.arbitration import plan_decisions


def _req(zone, rid="r1"):
    return {"zone_id": zone, "request_id": rid, "current_value": 1.2, "threshold_min": 1.5}


def _scored(zone, score, rid="r1", already_queued=False):
    return {"request": _req(zone, rid), "score": score, "already_queued": already_queued}


def test_single_request_fulfilled_when_tank_has_capacity():
    out = plan_decisions(200.0, 5.0, [_scored("zone-a", 0.44)])
    assert [d["decision"] for d in out["decisions"]] == ["fulfilled"]
    assert out["decisions"][0]["tank_volume_after"] == 195.0
    assert out["volume"] == 195.0
    assert out["alert"] is False


def test_contention_serves_highest_score_and_queues_loser():
    # tank holds exactly one allocation; two zones contend
    scored = [_scored("zone-a", 0.48, "ra"), _scored("zone-b", 0.47, "rb")]
    out = plan_decisions(5.0, 5.0, scored)
    by_zone = {d["request"]["zone_id"]: d["decision"] for d in out["decisions"]}
    assert by_zone == {"zone-a": "fulfilled", "zone-b": "queued"}
    assert out["volume"] == 0.0
    assert out["alert"] is True


def test_dry_tank_rejects_new_requests_with_alert():
    out = plan_decisions(2.0, 5.0, [_scored("zone-a", 0.48)])
    assert [d["decision"] for d in out["decisions"]] == ["rejected"]
    assert out["decisions"][0]["tank_volume_after"] is None
    assert out["alert"] is True


def test_dry_tank_keeps_already_queued_as_queued_not_rejected():
    out = plan_decisions(0.0, 5.0, [_scored("zone-b", 0.47, "rb", already_queued=True)])
    assert [d["decision"] for d in out["decisions"]] == ["queued"]
    assert out["alert"] is True


def test_decisions_are_ordered_highest_score_first():
    scored = [_scored("zone-b", 0.30, "rb"), _scored("zone-a", 0.48, "ra")]
    out = plan_decisions(200.0, 5.0, scored)
    assert [d["request"]["zone_id"] for d in out["decisions"]] == ["zone-a", "zone-b"]
