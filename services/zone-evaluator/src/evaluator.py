WARNING_MARGIN_FRAC = 0.1


def violation_edge(ec, ec_min, was_in_violation: bool):
    """Edge-trigger: enqueue only on the transition INTO EC violation."""
    now = ec is not None and ec < float(ec_min)
    return (now and not was_in_violation), now


def _ec_status(value, lo: float, hi: float) -> str:
    if value is None:
        return "normal"
    if value < lo or value > hi:
        return "critical"
    margin = (hi - lo) * WARNING_MARGIN_FRAC
    if value < lo + margin or value > hi - margin:
        return "warning"
    return "normal"


def _range_indicator(value, lo: float, hi: float) -> str:
    if value is None:
        return "in_range"
    return "out_of_range" if (value < lo or value > hi) else "in_range"


def evaluate_reading(reading: dict, thresholds: dict) -> dict:
    """Zone status is EC-only (the single arbitrated resource). pH and water
    temperature are advisory `indicators` (in_range/out_of_range) — displayed
    but never escalating status or raising alerts. water_level has no
    thresholds and stays a display-only numeric. Pure function — no IO."""
    status = _ec_status(reading.get("ec"), float(thresholds["ec_min"]), float(thresholds["ec_max"]))
    indicators = {
        "ph": _range_indicator(reading.get("ph"), float(thresholds["ph_min"]), float(thresholds["ph_max"])),
        "water_temp_c": _range_indicator(reading.get("water_temp_c"), float(thresholds["temp_min"]), float(thresholds["temp_max"])),
    }
    return {
        "status": status,
        "violated_params": ["ec"] if status != "normal" else [],
        "indicators": indicators,
    }
