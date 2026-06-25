WARNING_MARGIN_FRAC = 0.1

# reading key -> (min threshold key, max threshold key)
_PARAM_KEYS = {
    "ph": ("ph_min", "ph_max"),
    "ec": ("ec_min", "ec_max"),
    "water_temp_c": ("temp_min", "temp_max"),
}

_RANK = {"normal": 0, "warning": 1, "critical": 2}


def _param_status(value, lo: float, hi: float) -> str:
    if value is None:
        return "normal"
    if value < lo or value > hi:
        return "critical"
    margin = (hi - lo) * WARNING_MARGIN_FRAC
    if value < lo + margin or value > hi - margin:
        return "warning"
    return "normal"


def evaluate_reading(reading: dict, thresholds: dict) -> dict:
    """Per-parameter status (normal/warning/critical) for the three ranged
    params. water_level_pct has no threshold columns, so it is display-only and
    not evaluated. Pure function — no IO."""
    params = {}
    for param, (lo_key, hi_key) in _PARAM_KEYS.items():
        params[param] = _param_status(
            reading.get(param), float(thresholds[lo_key]), float(thresholds[hi_key])
        )
    violated = [p for p, s in params.items() if s != "normal"]
    status = "normal"
    for s in params.values():
        if _RANK[s] > _RANK[status]:
            status = s
    return {"status": status, "violated_params": violated, "params": params}
