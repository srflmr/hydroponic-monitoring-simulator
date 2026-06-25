const NUMERIC_FIELDS = ['ph_min', 'ph_max', 'ec_min', 'ec_max', 'temp_min', 'temp_max'];
const RANGE_PAIRS = [
  ['ph_min', 'ph_max'],
  ['ec_min', 'ec_max'],
  ['temp_min', 'temp_max'],
];

function validateZoneConfig(cfg) {
  const errors = [];
  if (typeof cfg.zone_id !== 'string' || cfg.zone_id.trim() === '') {
    errors.push('zone_id wajib berupa string tidak kosong');
  }
  if (typeof cfg.name !== 'string' || cfg.name.trim() === '') {
    errors.push('name wajib berupa string tidak kosong');
  }
  for (const f of NUMERIC_FIELDS) {
    if (typeof cfg[f] !== 'number' || Number.isNaN(cfg[f])) {
      errors.push(`${f} wajib berupa angka`);
    }
  }
  if (!Number.isInteger(cfg.priority) || cfg.priority < 1 || cfg.priority > 10) {
    errors.push('priority wajib bilangan bulat 1-10');
  }
  for (const [lo, hi] of RANGE_PAIRS) {
    if (typeof cfg[lo] === 'number' && typeof cfg[hi] === 'number' && !(cfg[lo] < cfg[hi])) {
      errors.push(`${lo} harus lebih kecil dari ${hi}`);
    }
  }
  return errors;
}

module.exports = { validateZoneConfig };
