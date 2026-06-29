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

REVERSION_FRAC = 0.15  # fraction pulled toward setpoint each step (mean reversion)


def revert(value: float, setpoint: float, frac: float = REVERSION_FRAC) -> float:
    """Pull `value` a fraction of the way toward `setpoint` (mean reversion)."""
    return value + (setpoint - value) * frac


def next_value(param: str, current: float, setpoint: float | None = None, bias: float = 0.0) -> float:
    """Next random-walk value. Optional `setpoint` adds mean reversion (keeps a
    param naturally near a baseline); `bias` adds a constant drift (e.g. EC
    consumption). Always clamped to PARAM_BOUNDS."""
    low, high = PARAM_BOUNDS[param]
    step = PARAM_STEP[param]
    candidate = current + random.uniform(-step, step) + bias
    if setpoint is not None:
        candidate = revert(candidate, setpoint)
    return max(low, min(high, candidate))
