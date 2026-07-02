const assert = require('node:assert');
const { test } = require('node:test');
const { validateZoneConfig } = require('../src/validate');

const VALID = {
  zone_id: 'zone-x', name: 'Zone X',
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

test('validateZoneConfig rejects zone_id with disallowed characters', () => {
  const cfg = {
    zone_id: 'zone-a" |> yield', name: 'Zone A',
    ph_min: 5.5, ph_max: 6.5, ec_min: 1.2, ec_max: 2.4,
    temp_min: 18, temp_max: 26, priority: 5,
  };
  const errors = validateZoneConfig(cfg);
  assert.ok(errors.some((e) => e.includes('zone_id may only contain')));
});

test('validateZoneConfig accepts a canonical zone_id', () => {
  const cfg = {
    zone_id: 'zone-a', name: 'Zone A',
    ph_min: 5.5, ph_max: 6.5, ec_min: 1.2, ec_max: 2.4,
    temp_min: 18, temp_max: 26, priority: 5,
  };
  assert.deepStrictEqual(validateZoneConfig(cfg), []);
});
