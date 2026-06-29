const ZONE_CONFIG_URL = process.env.ZONE_CONFIG_URL;
const ZONE_EVALUATOR_URL = process.env.ZONE_EVALUATOR_URL;
const RESOURCE_ARBITRATION_URL = process.env.RESOURCE_ARBITRATION_URL;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`upstream ${url} -> ${res.status}`);
  }
  return res.json();
}

async function fetchZones() {
  return getJson(`${ZONE_CONFIG_URL}/zones`);
}

async function fetchZoneCurrent(zoneId) {
  const res = await fetch(`${ZONE_EVALUATOR_URL}/zones/${zoneId}/current`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`evaluator ${zoneId} -> ${res.status}`);
  }
  return res.json();
}

async function fetchTank() {
  return getJson(`${RESOURCE_ARBITRATION_URL}/tank/status`);
}

async function fetchLogs(limit, offset) {
  return getJson(`${RESOURCE_ARBITRATION_URL}/logs?limit=${limit}&offset=${offset}`);
}

async function fetchPending() {
  return getJson(`${RESOURCE_ARBITRATION_URL}/requests/pending`);
}

async function forwardZoneWrite(method, path, body) {
  const res = await fetch(`${ZONE_CONFIG_URL}${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let parsed = null;
  try { parsed = await res.json(); } catch { parsed = null; }
  return { status: res.status, body: parsed };
}

async function forwardTankRefill(body) {
  const res = await fetch(`${RESOURCE_ARBITRATION_URL}/tank/refill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  let parsed = null;
  try { parsed = await res.json(); } catch { parsed = null; }
  return { status: res.status, body: parsed };
}

async function postSimulate(zoneId, param, value, durationSeconds) {
  const body = { param, value };
  if (durationSeconds !== undefined && durationSeconds !== null) {
    body.duration_seconds = durationSeconds;
  }
  const res = await fetch(`http://sensor-simulator-${zoneId}:3006/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`simulate ${zoneId} -> ${res.status}`);
  }
  return res.json();
}

module.exports = {
  fetchZones,
  fetchZoneCurrent,
  fetchTank,
  fetchLogs,
  fetchPending,
  postSimulate,
  forwardZoneWrite,
  forwardTankRefill,
};
