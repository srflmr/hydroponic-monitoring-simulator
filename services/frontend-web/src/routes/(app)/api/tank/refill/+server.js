import { json } from '@sveltejs/kit';
import { refillTank } from '$lib/api-client';

export async function POST() {
  try {
    return json(await refillTank());
  } catch (err) {
    return json({ error: 'upstream_unavailable', message: err.message }, { status: 502 });
  }
}
