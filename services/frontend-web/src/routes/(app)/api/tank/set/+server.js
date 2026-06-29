import { json } from '@sveltejs/kit';

const BASE = process.env.DASHBOARD_API_INTERNAL_URL || 'http://dashboard-api:3010';

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
    const res = await fetch(`${BASE}/api/tank/set`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ volume }),
    });
    const data = await res.json().catch(() => null);
    return json(data, { status: res.status });
  } catch {
    return json({ error: 'upstream_unavailable' }, { status: 502 });
  }
}
