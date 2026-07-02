import { json } from '@sveltejs/kit';
import { fetchLogs } from '$lib/api-client';

export async function GET({ url }) {
  const limit = Number(url.searchParams.get('limit')) || 100;
  const offset = Number(url.searchParams.get('offset')) || 0;
  try {
    return json(await fetchLogs(limit, offset));
  } catch (err) {
    return json({ error: 'upstream_unavailable', message: err.message }, { status: 502 });
  }
}
