def compute_criticality(current_value: float, threshold_min: float) -> float:
    """How far a reading sits below its minimum threshold, normalized to 0..1.

    0.0 means at/above the threshold (not critical); 1.0 means at/below zero
    (maximally critical). Pure function — no IO — so it is unit-testable.
    """
    if threshold_min <= 0:
        return 0.0
    shortfall = (threshold_min - current_value) / threshold_min
    return max(0.0, min(1.0, round(shortfall, 4)))


def calculate_score(zone_priority: int, criticality: float, w1: float, w2: float) -> float:
    """Combined priority score (PRD §13). Higher = more urgent."""
    return round((zone_priority / 10 * w1) + (criticality * w2), 4)
