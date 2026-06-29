"""Pure helpers for tank volume calculations."""


def clamp_volume(volume: float, capacity: float) -> float:
    return max(0.0, min(capacity, round(volume, 2)))
