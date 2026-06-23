def evaluate_reading(reading: dict, thresholds: dict) -> dict:
    """Compare a reading against zone thresholds.

    Walking-skeleton scope: only EC-below-minimum is detected. Full
    normal/warning/critical logic across all parameters arrives in a later phase.
    """
    violated = []
    ec = reading.get("ec")
    if ec is not None and ec < thresholds["ec_min"]:
        violated.append("ec")
    status = "critical" if violated else "normal"
    return {"status": status, "violated_params": violated}
