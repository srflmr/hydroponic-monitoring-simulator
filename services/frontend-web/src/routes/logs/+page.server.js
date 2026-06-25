import { fetchLogs } from '$lib/api-client';

export async function load() {
  try {
    const data = await fetchLogs(100, 0);
    return { logs: data.logs ?? [], total: data.total ?? 0 };
  } catch (err) {
    console.error('logs load failed:', err.message);
    return { logs: [], total: 0 };
  }
}
