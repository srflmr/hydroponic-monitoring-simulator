from src.random_walk import next_value, PARAM_BOUNDS


def test_next_value_stays_within_bounds():
    low, high = PARAM_BOUNDS["ec"]
    value = high
    for _ in range(1000):
        value = next_value("ec", value)
        assert low <= value <= high


def test_next_value_moves_within_one_step():
    result = next_value("ph", 6.0)
    assert abs(result - 6.0) <= 0.1
