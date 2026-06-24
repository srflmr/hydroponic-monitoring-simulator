import { fail } from '@sveltejs/kit';
import { fetchZones, fetchTank, postSimulate } from '$lib/api-client';

export async function load() {
  const [zones, tank] = await Promise.all([fetchZones(), fetchTank()]);
  return { zones, tank };
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
