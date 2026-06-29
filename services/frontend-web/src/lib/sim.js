// Live farm-store adapter: maps SSR REST data and Socket.io events into the
// `farm` writable store consumed by all components.

import { writable } from 'svelte/store';
import { connectSocket } from '$lib/socket';
import { fetchZones, refillTank as apiRefill, updateZone, setTankVolume, postSimulate } from '$lib/api-client';
import { splitName, mapZone, mapTank, mapLog } from './mappers.js';
import { upsertAlert, clearAlertForZone } from './alerts.js';
import { pendingToQueue } from './sim-pending.js';

export { pendingToQueue } from './sim-pending.js';

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
    alerts: [],
    actuated: {},
    now: nowStr(),
    history: {},
    logs: [],
  };
}

export const farm = writable(initialState());

export function seedFarm({ zones, tank, logs, pending }) {
  const { queue, alerts } = pendingToQueue(pending);
  farm.update((s) => ({
    ...s,
    zones: (zones || []).map(mapZone),
    tank: tank ? mapTank(tank) : s.tank,
    logs: (logs && logs.logs ? logs.logs : []).map(mapLog).slice(0, 16),
    decisions: logs && logs.total != null ? logs.total : s.decisions,
    queue,
    alerts,
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
    const alerts = l.decision === 'fulfilled' ? clearAlertForZone(s.alerts, l.zone_id) : s.alerts;
    return { ...s, logs: [log, ...s.logs].slice(0, 16), decisions: s.decisions + 1, serving, queue, alerts };
  }));

  socket.on('alert', (a) => farm.update((s) => ({ ...s, alerts: upsertAlert(s.alerts, a) })));

  socket.on('actuator:status', (st) => farm.update((s) => {
    if (!st || !st.zone_id) return s;
    const serving = { ...s.serving };
    delete serving[st.zone_id];
    return { ...s, serving, actuated: { ...s.actuated, [st.zone_id]: Date.now() } };
  }));

  // Expire "serving" and "actuated" entries older than 5 s.
  const sweep = setInterval(() => farm.update((s) => {
    const now = Date.now();
    const serving = {};
    for (const [id, t] of Object.entries(s.serving)) {
      if (now - t < 5000) serving[id] = t;
    }
    const actuated = {};
    for (const [id, t] of Object.entries(s.actuated)) {
      if (now - t < 5000) actuated[id] = t;
    }
    return { ...s, serving, actuated };
  }), 1000);

  return () => {
    clearInterval(clock); clock = null;
    clearInterval(sweep);
    if (socket) { socket.close(); socket = null; }
  };
}

export function dismissAlert(zoneId) {
  farm.update((s) => ({ ...s, alerts: clearAlertForZone(s.alerts, zoneId) }));
}

export async function refillTank(amount) {
  try {
    const tank = await apiRefill(amount);
    if (tank) farm.update((s) => ({ ...s, tank: mapTank(tank) }));
  } catch (_e) {
    // A tank:update WS event may still follow; ignore the REST error.
  }
}

export async function forceTankLow(volume = 20) {
  try {
    const tank = await setTankVolume(volume);
    if (tank) farm.update((s) => ({ ...s, tank: mapTank(tank) }));
  } catch (_e) { /* WS tank:update may follow */ }
}

export async function triggerContention(value = 0.4, duration = 30) {
  const zones = await fetchZones().catch(() => []);
  await Promise.all(zones.map((z) => postSimulate(z.zone_id, 'ec', value, duration).catch(() => null)));
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
