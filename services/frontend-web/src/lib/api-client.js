import { env } from '$env/dynamic/private';

const BASE = env.DASHBOARD_API_INTERNAL_URL || 'http://dashboard-api:3010';

export async function fetchZones() {
  const res = await fetch(`${BASE}/api/zones`);
  if (!res.ok) {
    throw new Error(`zones ${res.status}`);
  }
  return res.json();
}

export async function fetchTank() {
  const res = await fetch(`${BASE}/api/tank`);
  if (!res.ok) {
    throw new Error(`tank ${res.status}`);
  }
  return res.json();
}

export async function fetchLogs(limit = 50, offset = 0) {
  const res = await fetch(`${BASE}/api/logs?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`logs ${res.status}`);
  return res.json();
}

export async function fetchHistory(zoneId, param = 'ec') {
  const res = await fetch(`${BASE}/api/zones/${zoneId}/history?param=${param}`);
  if (!res.ok) throw new Error(`history ${res.status}`);
  return res.json();
}

export async function postSimulate(zoneId, param, value, durationSeconds) {
  const res = await fetch(`${BASE}/api/simulate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      zone_id: zoneId,
      param,
      value,
      duration_seconds: durationSeconds,
    }),
  });
  if (!res.ok) {
    throw new Error(`simulate ${res.status}`);
  }
  return res.json();
}
