// Live farm-store adapter: maps SSR REST data and Socket.io events into the
// `farm` writable store consumed by all components.

import { writable } from 'svelte/store';
import { connectSocket } from '$lib/socket';
import { fetchZones, refillTank as apiRefill, updateZone } from '$lib/api-client';
import { splitName, mapZone, mapTank, mapLog } from './mappers.js';

// Re-exported for backward-compat; canonical source is ./mappers.js.
export { splitName, mapZone, mapTank, mapLog } from './mappers.js';
export { STATUS_MAP } from './mappers.js';

function nowStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function initialState() {
  return {
    zones: [],
    tank: { volume: 0, capacity: 200 },
    serving: {},
    queue: [],
    decisions: 0,
    alert: false,
    now: nowStr(),
    history: {},
    logs: [],
  };
}

export const farm = writable(initialState());

export function seedFarm({ zones, tank, logs }) {
  farm.update((s) => ({
    ...s,
    zones: (zones || []).map(mapZone),
    tank: tank ? mapTank(tank) : s.tank,
    logs: (logs && logs.logs ? logs.logs : []).map(mapLog).slice(0, 16),
    decisions: logs && logs.total != null ? logs.total : s.decisions,
    now: nowStr(),
  }));
}

let socket = null, clock = null;

export function connectStream() {
  clock = setInterval(() => farm.update((s) => ({ ...s, now: nowStr() })), 1000);
  socket = connectSocket();

  socket.on('zone:update', (r) => farm.update((s) => ({
    ...s,
    zones: s.zones.map((z) => z.id === r.zone_id
      ? { ...z, ph: Number(r.ph), ec: Number(r.ec), temp: Number(r.water_temp_c), level: Number(r.water_level_pct) }
      : z),
  })));

  socket.on('tank:update', (t) => farm.update((s) => ({ ...s, tank: mapTank(t) })));

  socket.on('arbitration:log', (l) => farm.update((s) => {
    const log = mapLog(l);
    const serving = { ...s.serving };
    let queue = s.queue.filter((id) => id !== l.zone_id);
    if (l.decision === 'fulfilled') {
      serving[l.zone_id] = Date.now();
    } else if (l.decision === 'queued') {
      queue = [...queue, l.zone_id];
    }
    return { ...s, logs: [log, ...s.logs].slice(0, 16), decisions: s.decisions + 1, serving, queue };
  }));

  socket.on('alert', () => farm.update((s) => ({ ...s, alert: true })));

  // Expire "serving" entries older than 5 s so the flow dot stops animating.
  const sweep = setInterval(() => farm.update((s) => {
    const now = Date.now();
    const serving = {};
    for (const [id, t] of Object.entries(s.serving)) {
      if (now - t < 5000) serving[id] = t;
    }
    return { ...s, serving };
  }), 1000);

  return () => {
    clearInterval(clock); clock = null;
    clearInterval(sweep);
    if (socket) { socket.close(); socket = null; }
  };
}

export async function refillTank() {
  try {
    await apiRefill();
  } catch (_e) {
    // The tank:update WS event will carry the authoritative volume; ignore the REST error.
  }
}

// draft shape: { [zoneId]: { phMin, phMax, ecMin, ecMax, tempMin, tempMax, priority } }
// All values are strings from form inputs; coerced to numbers before the PUT.
export async function applyConfig(draft) {
  const num = (x) => { const n = parseFloat(x); return Number.isNaN(n) ? undefined : n; };
  const errors = [];
  for (const [zoneId, d] of Object.entries(draft)) {
    const fields = {
      ph_min: num(d.phMin), ph_max: num(d.phMax),
      ec_min: num(d.ecMin), ec_max: num(d.ecMax),
      temp_min: num(d.tempMin), temp_max: num(d.tempMax),
      priority: num(d.priority),
    };
    const res = await updateZone(zoneId, fields);
    if (!res.ok) errors.push({ zoneId, status: res.status, body: res.body });
  }
  // Refetch so the store immediately reflects the saved config.
  try {
    const zones = await fetchZones();
    farm.update((s) => ({ ...s, zones: zones.map(mapZone) }));
  } catch (_e) {
    // Keep current store state on refetch failure.
  }
  return errors;
}
