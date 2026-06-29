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


from src.random_walk import next_value, revert, REVERSION_FRAC


def test_revert_pulls_toward_setpoint():
    # value above setpoint moves down toward it; below moves up
    assert revert(7.0, 6.0, 0.15) < 7.0
    assert revert(5.0, 6.0, 0.15) > 5.0
    # exactly at setpoint is unchanged
    assert revert(6.0, 6.0, 0.15) == 6.0


def test_ph_reverts_below_high_value():
    # from a high pH with a 6.0 setpoint, every step lands below the start (mean reversion dominates the max walk step)
    for _ in range(50):
        assert next_value("ph", 7.5, setpoint=6.0) < 7.5


def test_ec_consumption_bias_trends_down_but_clamps_to_floor():
    # negative bias pushes ec down; never below the 0.5 floor
    v = next_value("ec", 0.52, bias=-0.05)
    assert v >= 0.5
    # with no setpoint and negative bias, from mid-range it should not exceed current+step
    assert next_value("ec", 2.0, bias=-0.05) <= 2.0 + 0.05


def test_no_setpoint_no_bias_matches_plain_walk_bounds():
    v = next_value("water_level_pct", 90.0)
    assert 0.0 <= v <= 100.0
