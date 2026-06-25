// services/frontend-web/test/data.test.mjs
import assert from 'node:assert';
import { statusOf, zoneStatus } from '../src/lib/data.js';

// 10%-of-range band: ec 1.5..2.5 -> margin 0.1
assert.strictEqual(statusOf('ec', 2.0, 1.5, 2.5), 'ok',   'mid-range ok');
assert.strictEqual(statusOf('ec', 1.55, 1.5, 2.5), 'warn', 'within 10% of low edge warn');
assert.strictEqual(statusOf('ec', 1.5, 1.5, 2.5), 'warn', 'at min edge warn (not crit)');
assert.strictEqual(statusOf('ec', 1.2, 1.5, 2.5), 'crit', 'below min crit');
assert.strictEqual(statusOf('temp', 30, 22, 28), 'crit', 'above max crit');
// level uses the display heuristic
assert.strictEqual(statusOf('level', 90, 80, 100), 'ok');
assert.strictEqual(statusOf('level', 70, 80, 100), 'warn');
assert.strictEqual(statusOf('level', 50, 80, 100), 'crit');
// zoneStatus = worst over ph/ec/temp ONLY (level excluded)
const z = { ph: 6.0, ec: 2.0, temp: 25, level: 30, th: { phMin:5.5, phMax:6.5, ecMin:1.5, ecMax:2.5, tempMin:22, tempMax:28 } };
assert.strictEqual(zoneStatus(z).key, 'ok', 'low level does NOT make zone crit');
const z2 = { ...z, ec: 1.2 };
assert.strictEqual(zoneStatus(z2).key, 'crit', 'critical ec drives zone status');
console.log('data.test.js: all assertions passed');
