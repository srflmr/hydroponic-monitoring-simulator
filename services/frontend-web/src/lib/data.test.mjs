import test from 'node:test';
import assert from 'node:assert';
import { zoneStatus, metric } from './data.js';

const zone = (over) => ({
  ph: 6.0, ec: 2.0, temp: 25, level: 90,
  th: { phMin: 5.5, phMax: 6.5, ecMin: 1.5, ecMax: 2.5, tempMin: 22, tempMax: 28 },
  ...over,
});

test('zone status is critical only when EC is out of range', () => {
  assert.equal(zoneStatus(zone({ ec: 1.2 })).key, 'crit');     // EC low -> crit
  assert.equal(zoneStatus(zone({ ph: 7.5 })).key, 'ok');       // pH high, EC fine -> ok
  assert.equal(zoneStatus(zone({ temp: 35 })).key, 'ok');      // temp high, EC fine -> ok
});

test('pH/temp out of range render as advisory (warn), never crit', () => {
  assert.equal(metric('ph', 7.5, 5.5, 6.5).statusKey, 'warn');
  assert.equal(metric('temp', 35, 22, 28).statusKey, 'warn');
  assert.equal(metric('ec', 1.2, 1.5, 2.5).statusKey, 'crit'); // EC keeps full crit
});
