import { fail } from '@sveltejs/kit';
import { fetchZones, fetchTank, postSimulate } from '$lib/api-client';

export async function load() {
  try {
    const [zones, tank] = await Promise.all([fetchZones(), fetchTank()]);
    return { zones, tank };
  } catch (err) {
    // dashboard-api unreachable at render time — render an empty shell;
    // live values still arrive over the WebSocket once it connects.
    console.error('dashboard-api unreachable during SSR:', err.message);
    return { zones: [], tank: {} };
  }
}

export const actions = {
  simulate: async ({ request }) => {
    const form = await request.formData();
    const zoneId = form.get('zone_id');
    try {
      await postSimulate(zoneId, 'ec', 1.1, 20);
    } catch (err) {
      return fail(502, { error: 'simulate_failed' });
    }
    return { triggered: true };
  },
};
