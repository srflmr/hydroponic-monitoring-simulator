import { fetchZones, fetchTank, fetchLogs } from '$lib/api-client';

export async function load() {
  try {
    const [zones, tank, logs] = await Promise.all([fetchZones(), fetchTank(), fetchLogs(16, 0)]);
    return { zones, tank, logs };
  } catch (err) {
    return { zones: [], tank: { current_volume: 0, capacity: 200 }, logs: { logs: [], total: 0 } };
  }
}
