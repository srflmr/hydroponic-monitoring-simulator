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
    """Human-readable reason string for a decision (for the log feed)."""
    if decision == "fulfilled":
        return (
            f"EC {current_value} is below the minimum threshold {threshold_min}; "
            f"tank has enough volume, allocation approved (score {score})"
        )
    if decision == "queued":
        if top_zone:
            return f"Score {score} lost to {top_zone}, which is being served first; waiting for tank capacity"
        return f"Score {score}; waiting for tank capacity (will be retried on refill)"
    return f"Tank volume insufficient (needs refilling); request rejected (score {score})"
