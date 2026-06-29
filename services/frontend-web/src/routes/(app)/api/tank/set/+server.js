import { json } from '@sveltejs/kit';
import { setTankVolume } from '$lib/api-client';

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 });
  }

  const { volume } = body;
  if (typeof volume !== 'number' || !Number.isFinite(volume) || volume < 0) {
    return json({ error: 'invalid_volume', message: 'volume must be a finite number >= 0' }, { status: 400 });
  }

  try {
    return json(await setTankVolume(volume));
  } catch (err) {
    return json({ error: 'upstream_unavailable', message: err.message }, { status: 502 });
  }
}
