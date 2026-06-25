import { fetchLogs } from '$lib/api-client';
export async function load() {
  try { const d = await fetchLogs(100, 0); return { logs: d.logs || [], total: d.total || 0 }; }
  catch { return { logs: [], total: 0 }; }
}
