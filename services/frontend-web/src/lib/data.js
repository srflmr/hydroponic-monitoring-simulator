// Pure JS domain data and helpers — no Svelte imports so this module is unit-testable under bare Node.

export const COLORS = {
  ok:   { txt: 'var(--ok)',   ring: 'var(--ok-ring)',   soft: 'var(--ok-soft)',   dot: 'var(--ok-ring)',   label: 'Optimal' },
  warn: { txt: 'var(--warn)', ring: 'var(--warn-ring)', soft: 'var(--warn-soft)', dot: 'var(--warn-ring)', label: 'Attention' },
  crit: { txt: 'var(--crit)', ring: 'var(--crit-ring)', soft: 'var(--crit-soft)', dot: 'var(--crit-ring)', label: 'Critical' }
};

export const DECISION = {
  fulfilled: { txt: 'var(--ok)',   soft: 'var(--ok-soft)',   dot: 'var(--ok-ring)',   label: 'Fulfilled', sym: '✓' },
  queued:    { txt: 'var(--warn)', soft: 'var(--warn-soft)', dot: 'var(--warn-ring)', label: 'Queued',    sym: '⋯' },
  rejected:  { txt: 'var(--crit)', soft: 'var(--crit-soft)', dot: 'var(--crit-ring)', label: 'Rejected',  sym: '!' }
};

// Axis bounds for rings and charts, keyed by signal name.
export const RANGE = {
  ph:    { dmin: 4.5, dmax: 7.5, dec: 1, unit: '' },
  ec:    { dmin: 0,   dmax: 3,   dec: 2, unit: 'mS/cm' },
  temp:  { dmin: 18,  dmax: 32,  dec: 1, unit: '°C' },
  level: { dmin: 0,   dmax: 100, dec: 0, unit: '%' }
};

export const defaultZones = [
  { id: 'zone-a', name: 'Zone A', crop: 'Kangkung', priority: 1, ph: 6.1, ec: 1.95, temp: 25.2, level: 90,
    th: { phMin: 5.5, phMax: 6.5, ecMin: 1.5, ecMax: 2.5, tempMin: 22, tempMax: 28 } },
  { id: 'zone-b', name: 'Zone B', crop: 'Selada',   priority: 2, ph: 6.0, ec: 0.78, temp: 24.4, level: 78,
    th: { phMin: 5.5, phMax: 6.5, ecMin: 0.8, ecMax: 1.2, tempMin: 22, tempMax: 28 } },
  { id: 'zone-c', name: 'Zone C', crop: 'Pakcoy',   priority: 3, ph: 5.8, ec: 1.70, temp: 26.6, level: 84,
    th: { phMin: 5.5, phMax: 6.5, ecMin: 1.4, ecMax: 2.2, tempMin: 22, tempMax: 28 } }
];

export const clone = (v) => JSON.parse(JSON.stringify(v));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const WARNING_MARGIN_FRAC = 0.1;

// Warning band is 10% of range on each side, matching the backend evaluator. Level uses fixed display thresholds.
export function statusOf(key, v, lo, hi) {
  if (key === 'level') return v >= 80 ? 'ok' : v >= 60 ? 'warn' : 'crit';
  if (v < lo || v > hi) return 'crit';
  const m = (hi - lo) * WARNING_MARGIN_FRAC;
  return v < lo + m || v > hi - m ? 'warn' : 'ok';
}

// Returns a view-model for one reading: formatted value, colours, and gauge fill fraction.
export function metric(key, v, lo, hi) {
  const r = RANGE[key];
  const statusKey = statusOf(key, v, lo, hi);
  const c = COLORS[statusKey];
  const pct = clamp((v - r.dmin) / (r.dmax - r.dmin), 0, 1);
  return {
    key,
    value: key === 'level' ? String(Math.round(v)) : v.toFixed(r.dec),
    statusKey,
    txt: c.txt, ring: c.ring, soft: c.soft, dot: c.dot,
    pct
  };
}

// Derives zone status from ph/ec/temp only; water level is display-only and never affects zone status.
export function zoneStatus(zone) {
  const order = { ok: 0, warn: 1, crit: 2 };
  const keys = [
    metric('ph', zone.ph, zone.th.phMin, zone.th.phMax),
    metric('ec', zone.ec, zone.th.ecMin, zone.th.ecMax),
    metric('temp', zone.temp, zone.th.tempMin, zone.th.tempMax)
  ];
  const worst = keys.reduce((a, m) => (order[m.statusKey] > order[a.statusKey] ? m : a));
  return { key: worst.statusKey, ...COLORS[worst.statusKey] };
}
