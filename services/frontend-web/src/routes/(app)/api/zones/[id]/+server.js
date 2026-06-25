import { json } from '@sveltejs/kit';
import { updateZone } from '$lib/api-client';

export async function PUT({ params, request }) {
  try {
    const fields = await request.json();
    const { status, body } = await updateZone(params.id, fields);
    return json(body, { status });
  } catch (err) {
    return json({ error: 'upstream_unavailable', message: err.message }, { status: 502 });
  }
}
