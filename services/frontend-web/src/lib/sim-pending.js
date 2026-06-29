// Pure helpers for pending arbitration snapshot — no Svelte imports so this is unit-testable under bare Node.

/**
 * Convert a pending-arbitration snapshot (from GET /api/arbitration/pending)
 * into the queue and alerts arrays consumed by the farm store.
 *
 * @param {object|null} pending - { pending: Array<{zone_id, ...}>, total: number } or null/undefined
 * @returns {{ queue: Array<{zone_id: string, score: number}>, alerts: object[] }}
 */
export function pendingToQueue(pending) {
  const items = (pending && pending.pending) || [];
  return {
    queue: items.map((p) => ({ zone_id: p.zone_id, score: p.score })),
    alerts: items.map((p) => ({
      zone_id: p.zone_id,
      severity: 'warning',
      message: 'Menunggu alokasi (tangki)',
    })),
  };
}
