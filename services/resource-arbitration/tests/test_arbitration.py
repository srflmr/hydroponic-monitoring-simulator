from src.arbitration import decide_allocation


def test_fulfilled_when_volume_exceeds_allocation():
    result = decide_allocation(200.0, 5.0)
    assert result["decision"] == "fulfilled"
    assert result["new_volume"] == 195.0


def test_fulfilled_at_exact_boundary_leaves_zero():
    result = decide_allocation(5.0, 5.0)
    assert result["decision"] == "fulfilled"
    assert result["new_volume"] == 0.0


def test_rejected_when_volume_below_allocation():
    result = decide_allocation(3.0, 5.0)
    assert result["decision"] == "rejected"
    assert result["new_volume"] is None
