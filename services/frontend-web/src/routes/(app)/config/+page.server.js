import { fetchZones } from '$lib/api-client';
export async function load() {
  try { return { zones: await fetchZones() }; } catch { return { zones: [] }; }
}
