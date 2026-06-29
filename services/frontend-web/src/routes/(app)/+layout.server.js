import { fetchZones, fetchTank, fetchLogs, fetchPending } from '$lib/api-client';

export async function load() {
  try {
    const [zones, tank, logs, pending] = await Promise.all([fetchZones(), fetchTank(), fetchLogs(16, 0), fetchPending()]);
    return { zones, tank, logs, pending };
  } catch (err) {
    return { zones: [], tank: { current_volume: 0, capacity: 200 }, logs: { logs: [], total: 0 }, pending: { pending: [], total: 0 } };
  }
}
