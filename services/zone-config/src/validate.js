const NUMERIC_FIELDS = ['ph_min', 'ph_max', 'ec_min', 'ec_max', 'temp_min', 'temp_max'];
const RANGE_PAIRS = [
  ['ph_min', 'ph_max'],
  ['ec_min', 'ec_max'],
  ['temp_min', 'temp_max'],
];

function validateZoneConfig(cfg) {
  const errors = [];
  if (typeof cfg.zone_id !== 'string' || cfg.zone_id.trim() === '') {
    errors.push('zone_id must be a non-empty string');
  } else if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(cfg.zone_id)) {
    errors.push('zone_id may only contain lowercase letters, digits, and hyphens (max 32 characters)');
  }
  if (typeof cfg.name !== 'string' || cfg.name.trim() === '') {
    errors.push('name must be a non-empty string');
  }
  for (const f of NUMERIC_FIELDS) {
    if (typeof cfg[f] !== 'number' || Number.isNaN(cfg[f])) {
      errors.push(`${f} must be a number`);
    }
  }
  if (!Number.isInteger(cfg.priority) || cfg.priority < 1 || cfg.priority > 10) {
    errors.push('priority must be an integer between 1 and 10');
  }
  for (const [lo, hi] of RANGE_PAIRS) {
    if (typeof cfg[lo] === 'number' && typeof cfg[hi] === 'number' && !(cfg[lo] < cfg[hi])) {
      errors.push(`${lo} must be less than ${hi}`);
    }
  }
  return errors;
}

module.exports = { validateZoneConfig };
