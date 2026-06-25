from src.evaluator import evaluate_reading

TH = {"ph_min": 5.5, "ph_max": 6.5, "ec_min": 1.5, "ec_max": 2.5, "temp_min": 22.0, "temp_max": 28.0}


def test_all_mid_range_is_normal():
    r = {"ph": 6.0, "ec": 2.0, "water_temp_c": 25.0, "water_level_pct": 90}
    out = evaluate_reading(r, TH)
    assert out["status"] == "normal"
    assert out["violated_params"] == []
    assert out["params"] == {"ph": "normal", "ec": "normal", "water_temp_c": "normal"}


def test_value_below_min_is_critical():
    out = evaluate_reading({"ec": 1.2}, TH)  # 1.2 < 1.5
    assert out["params"]["ec"] == "critical"
    assert out["status"] == "critical"
    assert "ec" in out["violated_params"]


def test_value_above_max_is_critical():
    out = evaluate_reading({"water_temp_c": 30.0}, TH)  # 30 > 28
    assert out["params"]["water_temp_c"] == "critical"


def test_value_within_10pct_of_low_edge_is_warning():
    # ec band 1.5..2.5, margin 0.1 -> [1.5,1.6) is warning
    out = evaluate_reading({"ec": 1.55}, TH)
    assert out["params"]["ec"] == "warning"
    assert out["status"] == "warning"


def test_value_at_exact_min_is_warning_not_critical():
    out = evaluate_reading({"ph": 5.5}, TH)
    assert out["params"]["ph"] == "warning"


def test_worst_param_wins_overall_status():
    r = {"ph": 6.0, "ec": 1.55, "water_temp_c": 30.0}  # normal, warning, critical
    out = evaluate_reading(r, TH)
    assert out["status"] == "critical"
    assert set(out["violated_params"]) == {"ec", "water_temp_c"}


def test_missing_param_treated_normal():
    out = evaluate_reading({"ec": 2.0}, TH)  # no ph/temp
    assert out["params"]["ph"] == "normal"
    assert out["params"]["water_temp_c"] == "normal"
