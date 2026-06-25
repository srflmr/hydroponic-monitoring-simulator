import { json } from '@sveltejs/kit';
import { updateZone } from '$lib/api-client';

export async function PUT({ params, request }) {
  const fields = await request.json();
  const { status, body } = await updateZone(params.id, fields);
  return json(body, { status });
}
