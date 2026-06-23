from src.evaluator import evaluate_reading


def test_low_ec_is_critical():
    result = evaluate_reading({"ec": 1.2}, {"ec_min": 1.5})
    assert result["status"] == "critical"
    assert result["violated_params"] == ["ec"]


def test_normal_ec_is_normal():
    result = evaluate_reading({"ec": 1.8}, {"ec_min": 1.5})
    assert result["status"] == "normal"
    assert result["violated_params"] == []


def test_missing_ec_is_normal():
    result = evaluate_reading({"ph": 6.0}, {"ec_min": 1.5})
    assert result["status"] == "normal"
    assert result["violated_params"] == []
