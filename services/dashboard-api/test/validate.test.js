const test = require('node:test');
const assert = require('node:assert');
const { isValidZoneId } = require('../src/lib/validate');

test('accepts a zone_id present in the valid list', () => {
  assert.strictEqual(isValidZoneId('zone-a', ['zone-a', 'zone-b']), true);
});

test('rejects a zone_id absent from the valid list', () => {
  assert.strictEqual(isValidZoneId('zone-x', ['zone-a', 'zone-b']), false);
});

test('rejects a non-string zone_id', () => {
  assert.strictEqual(isValidZoneId(123, ['zone-a']), false);
  assert.strictEqual(isValidZoneId(undefined, ['zone-a']), false);
});
