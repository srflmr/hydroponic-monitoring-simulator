// Pure ESM mappers — zero imports so bare Node can load this for unit tests.

export const STATUS_MAP = { normal: 'ok', warning: 'warn', critical: 'crit' };

export function splitName(name) {
  const i = (name || '').indexOf(' - ');
  if (i === -1) return { name: name || '', crop: name || '' };
  return { name: name.slice(0, i), crop: name.slice(i + 3) };
}

export function mid(a, b) {
  return (Number(a) + Number(b)) / 2;
}

export function mapZone(z) {
  const r = z.last_reading || {};
  const th = {
    phMin: Number(z.ph_min), phMax: Number(z.ph_max),
    ecMin: Number(z.ec_min), ecMax: Number(z.ec_max),
    tempMin: Number(z.temp_min), tempMax: Number(z.temp_max),
  };
  const { name, crop } = splitName(z.name);
  return {
    id: z.zone_id, name, crop, priority: Number(z.priority),
    ph: r.ph != null ? Number(r.ph) : mid(th.phMin, th.phMax),
    ec: r.ec != null ? Number(r.ec) : mid(th.ecMin, th.ecMax),
    temp: r.water_temp_c != null ? Number(r.water_temp_c) : mid(th.tempMin, th.tempMax),
    level: r.water_level_pct != null ? Number(r.water_level_pct) : 0,
    th,
  };
}

export function mapTank(t) {
  return { volume: Number(t.current_volume), capacity: Number(t.capacity) };
}

export function fmtTime(iso) {
  const m = /T(\d{2}:\d{2}:\d{2})/.exec(iso || '');
  return m ? m[1] : '';
}

export function mapLog(l) {
  const { name, crop } = splitName(l.zone_name || l.zone_id || '');
  return {
    id: l.id,
    zone_id: l.zone_id,
    time: fmtTime(l.requested_at),
    name: name || l.zone_id,
    crop,
    decision: l.decision,
    reason: l.reason,
  };
}
