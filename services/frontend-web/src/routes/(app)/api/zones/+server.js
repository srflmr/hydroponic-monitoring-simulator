import { json } from '@sveltejs/kit';
import { fetchZones } from '$lib/api-client';

export async function GET() {
  try {
    return json(await fetchZones());
  } catch (err) {
    return json({ error: 'upstream_unavailable', message: err.message }, { status: 502 });
  }
}
