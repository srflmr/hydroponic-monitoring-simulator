from src.scoring import compute_criticality, calculate_score


def test_criticality_zero_when_at_or_above_threshold():
    assert compute_criticality(1.5, 1.5) == 0.0
    assert compute_criticality(2.0, 1.5) == 0.0


def test_criticality_grows_as_value_falls_below_threshold():
    # (1.5 - 1.2) / 1.5 = 0.2
    assert compute_criticality(1.2, 1.5) == 0.2


def test_criticality_clamped_to_one_when_value_non_positive():
    assert compute_criticality(0.0, 1.5) == 1.0
    assert compute_criticality(-3.0, 1.5) == 1.0


def test_criticality_guards_nonpositive_threshold():
    assert compute_criticality(0.5, 0.0) == 0.0


def test_score_combines_priority_and_criticality_with_weights():
    # zone-a priority 8, criticality 0.2: 0.8*0.4 + 0.2*0.6 = 0.44
    assert calculate_score(8, 0.2, 0.4, 0.6) == 0.44


def test_score_zero_priority_zero_criticality():
    assert calculate_score(0, 0.0, 0.4, 0.6) == 0.0
