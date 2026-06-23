import random

PARAM_BOUNDS = {
    "ph": (4.0, 8.0),
    "ec": (0.5, 3.5),
    "water_temp_c": (15.0, 32.0),
    "water_level_pct": (0.0, 100.0),
}

PARAM_STEP = {
    "ph": 0.1,
    "ec": 0.05,
    "water_temp_c": 0.2,
    "water_level_pct": 1.0,
}


def next_value(param: str, current: float) -> float:
    """Return the next random-walk value for a parameter, clamped to its bounds."""
    low, high = PARAM_BOUNDS[param]
    step = PARAM_STEP[param]
    candidate = current + random.uniform(-step, step)
    return max(low, min(high, candidate))
