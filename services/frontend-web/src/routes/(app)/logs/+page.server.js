import { fetchLogs, fetchZones } from '$lib/api-client';

const PAGE_SIZE = 100;

export async function load() {
  try {
    const [logsData, zones] = await Promise.all([fetchLogs(PAGE_SIZE, 0), fetchZones()]);
    return {
      logs: logsData.logs || [],
      total: logsData.total || 0,
      zones: zones || [],
      pageSize: PAGE_SIZE,
    };
  } catch {
    return { logs: [], total: 0, zones: [], pageSize: PAGE_SIZE };
  }
}
