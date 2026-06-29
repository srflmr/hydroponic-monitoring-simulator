from src.evaluator import evaluate_reading

TH = {"ph_min": 5.5, "ph_max": 6.5, "ec_min": 1.5, "ec_max": 2.5, "temp_min": 22.0, "temp_max": 28.0}


def test_status_is_ec_only_ph_out_of_range_stays_normal():
    out = evaluate_reading({"ph": 7.0, "ec": 2.0, "water_temp_c": 25.0}, TH)  # pH high, EC fine
    assert out["status"] == "normal"
    assert out["violated_params"] == []
    assert out["indicators"]["ph"] == "out_of_range"
    assert out["indicators"]["water_temp_c"] == "in_range"


def test_ec_below_min_is_critical():
    out = evaluate_reading({"ph": 6.0, "ec": 1.2, "water_temp_c": 25.0}, TH)
    assert out["status"] == "critical"
    assert out["violated_params"] == ["ec"]


def test_ec_near_bound_is_warning():
    out = evaluate_reading({"ph": 6.0, "ec": 1.55, "water_temp_c": 25.0}, TH)  # within 10% margin of ec_min
    assert out["status"] == "warning"


def test_temp_out_of_range_is_advisory_not_critical():
    out = evaluate_reading({"ph": 6.0, "ec": 2.0, "water_temp_c": 31.0}, TH)
    assert out["status"] == "normal"
    assert out["indicators"]["water_temp_c"] == "out_of_range"
