import { browser } from '$app/environment';

// Server-side: call dashboard-api directly over the internal Docker network.
// Browser-side: use a relative path (same-origin via Traefik) — $env/dynamic/private
// cannot be imported in a module bundled for the client.
// eslint-disable-next-line no-undef
const BASE = browser ? '' : (typeof process !== 'undefined' ? (process.env.DASHBOARD_API_INTERNAL_URL || 'http://dashboard-api:3010') : 'http://dashboard-api:3010');

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

export async function refillTank(amount) {
  const res = await fetch(`${BASE}/api/tank/refill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(amount === undefined ? {} : { amount }),
  });
  if (!res.ok) throw new Error(`refill ${res.status}`);
  return res.json();
}

export async function updateZone(zoneId, fields) {
  const res = await fetch(`${BASE}/api/zones/${zoneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}
