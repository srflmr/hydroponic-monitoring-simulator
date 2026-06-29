from src.tank_utils import clamp_volume


def test_clamp_volume_bounds():
    assert clamp_volume(20.0, 200.0) == 20.0
    assert clamp_volume(-5.0, 200.0) == 0.0
    assert clamp_volume(250.0, 200.0) == 200.0
    assert clamp_volume(19.999, 200.0) == 20.0  # rounded to 2dp
