def plan_decisions(volume: float, allocation: float, scored: list[dict]) -> dict:
    """Decide fulfilled/queued/rejected for a set of scored requests.

    Pure function (no IO). Serves the highest-score requests first while the
    tank holds at least one allocation. Of the unserved remainder: if anything
    was fulfilled this round (contention) or the item was already queued, it
    stays `queued`; otherwise the tank was dry for a fresh request -> `rejected`.
    """
    ordered = sorted(scored, key=lambda s: s["score"], reverse=True)
    decisions = []
    fulfilled = 0
    for s in ordered:
        if volume >= allocation:
            volume = round(volume - allocation, 2)
            decisions.append(
                {"request": s["request"], "score": s["score"],
                 "decision": "fulfilled", "tank_volume_after": volume}
            )
            fulfilled += 1
        else:
            decisions.append(
                {"request": s["request"], "score": s["score"],
                 "decision": "_pending", "tank_volume_after": None,
                 "already_queued": s["already_queued"]}
            )

    any_fulfilled = fulfilled > 0
    for d in decisions:
        if d["decision"] != "_pending":
            continue
        if any_fulfilled or d.pop("already_queued"):
            d["decision"] = "queued"
        else:
            d.pop("already_queued", None)
            d["decision"] = "rejected"

    alert = any(d["decision"] in ("queued", "rejected") for d in decisions)
    return {"decisions": decisions, "volume": volume, "alert": alert}


def build_reason(decision: str, score: float, current_value, threshold_min, top_zone=None) -> str:
    """Human-readable Indonesian reason string for a decision (for the log feed)."""
    if decision == "fulfilled":
        return (
            f"EC {current_value} di bawah ambang minimum {threshold_min}; "
            f"tangki cukup, alokasi disetujui (skor {score})"
        )
    if decision == "queued":
        if top_zone:
            return f"Skor {score} kalah dari {top_zone} yang dilayani lebih dulu; menunggu kapasitas tangki"
        return f"Skor {score}; menunggu kapasitas tangki (akan diproses ulang saat refill)"
    return f"Tangki tidak cukup (perlu diisi ulang); permintaan ditolak (skor {score})"
