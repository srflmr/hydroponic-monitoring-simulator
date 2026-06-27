import os

from psycopg_pool import ConnectionPool

POSTGRES_URL = os.environ["POSTGRES_URL"]

pool = ConnectionPool(POSTGRES_URL, min_size=1, max_size=4, open=False)


def init() -> None:
    """Buka connection pool. Dipanggil saat startup, bukan saat import (agar test bisa import db)."""
    pool.open()


def ping() -> None:
    with pool.connection() as conn:
        conn.execute("SELECT 1")


def get_tank() -> dict:
    with pool.connection() as conn:
        row = conn.execute(
            "SELECT current_volume, capacity FROM tank_status WHERE id = 1"
        ).fetchone()
    return {"current_volume": float(row[0]), "capacity": float(row[1])}


def update_tank_volume(new_volume: float) -> None:
    with pool.connection() as conn:
        conn.execute(
            "UPDATE tank_status SET current_volume = %s, updated_at = now() WHERE id = 1",
            (new_volume,),
        )


def insert_log(entry: dict) -> str:
    with pool.connection() as conn:
        row = conn.execute(
            """
            INSERT INTO arbitration_logs
                (request_id, zone_id, requested_at, decision, reason,
                 score, volume_requested, tank_volume_after, decided_at)
            VALUES (%(request_id)s, %(zone_id)s, %(requested_at)s, %(decision)s,
                    %(reason)s, %(score)s, %(volume_requested)s,
                    %(tank_volume_after)s, %(decided_at)s)
            RETURNING id
            """,
            entry,
        ).fetchone()
    return str(row[0])


def get_logs(limit: int, offset: int) -> dict:
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT id, zone_id, requested_at, decision, reason, tank_volume_after
            FROM arbitration_logs
            ORDER BY requested_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        ).fetchall()
        total = conn.execute("SELECT count(*) FROM arbitration_logs").fetchone()[0]
    logs = [
        {
            "id": str(r[0]),
            "zone_id": r[1],
            "requested_at": r[2].strftime("%Y-%m-%dT%H:%M:%SZ"),
            "decision": r[3],
            "reason": r[4],
            "tank_volume_after": float(r[5]) if r[5] is not None else None,
        }
        for r in rows
    ]
    return {"logs": logs, "total": total, "limit": limit, "offset": offset}
