def decide_allocation(current_volume: float, allocation: float) -> dict:
    """Decide whether a resource request can be fulfilled from the tank.

    Walking-skeleton scope: naive. Fulfill when the tank holds at least one
    allocation, otherwise reject. No priority scoring / heapq / queueing yet
    (those arrive in a later phase). Fulfilling only when
    current_volume >= allocation guarantees the tank never goes negative,
    so the tank_status CHECK constraint is never violated.
    """
    if current_volume >= allocation:
        new_volume = round(current_volume - allocation, 2)
        return {
            "decision": "fulfilled",
            "new_volume": new_volume,
            "reason": (
                f"Tangki cukup ({current_volume} L >= {allocation} L); "
                f"alokasi {allocation} L disetujui"
            ),
        }
    return {
        "decision": "rejected",
        "new_volume": None,
        "reason": f"Tangki tidak cukup ({current_volume} L < {allocation} L)",
    }
