const assert = require('node:assert');
const { validateZoneConfig } = require('../src/validate');

const VALID = {
  zone_id: 'zone-x', name: 'Zona X',
  ph_min: 5.5, ph_max: 6.5, ec_min: 1.5, ec_max: 2.5, temp_min: 22.0, temp_max: 28.0, priority: 8,
};

assert.deepStrictEqual(validateZoneConfig(VALID), [], 'valid config has no errors');
assert.ok(validateZoneConfig({ ...VALID, ph_min: 6.5, ph_max: 6.5 }).length > 0, 'ph_min must be < ph_max');
assert.ok(validateZoneConfig({ ...VALID, ec_min: 3.0 }).length > 0, 'ec_min >= ec_max rejected');
assert.ok(validateZoneConfig({ ...VALID, temp_min: 28.0, temp_max: 22.0 }).length > 0, 'temp range rejected');
assert.ok(validateZoneConfig({ ...VALID, priority: 0 }).length > 0, 'priority < 1 rejected');
assert.ok(validateZoneConfig({ ...VALID, priority: 11 }).length > 0, 'priority > 10 rejected');
assert.ok(validateZoneConfig({ ...VALID, priority: 5.5 }).length > 0, 'non-integer priority rejected');
assert.ok(validateZoneConfig({ ...VALID, ec_min: '1.5' }).length > 0, 'non-numeric threshold rejected');
assert.ok(validateZoneConfig({ ...VALID, name: undefined }).length > 0, 'missing name rejected');
console.log('validate.test.js: all assertions passed');
