import assert from 'node:assert/strict';
import { upsertAlert, clearAlertForZone } from '../src/lib/alerts.js';

let a = upsertAlert([], { zone_id: 'zone-a', message: 'low', severity: 'warning' });
assert.equal(a.length, 1);
assert.equal(a[0].zone_id, 'zone-a');

// same zone -> replace (latest wins), no duplicate
a = upsertAlert(a, { zone_id: 'zone-a', message: 'dry', severity: 'critical' });
assert.equal(a.length, 1);
assert.equal(a[0].severity, 'critical');
assert.equal(a[0].message, 'dry');

// different zone -> keep both
a = upsertAlert(a, { zone_id: 'zone-b', message: 'low', severity: 'warning' });
assert.equal(a.length, 2);

// clear removes only that zone
a = clearAlertForZone(a, 'zone-a');
assert.deepEqual(a.map((x) => x.zone_id), ['zone-b']);

// malformed input ignored
assert.equal(upsertAlert(a, null).length, 1);
assert.equal(upsertAlert(a, { message: 'x' }).length, 1);

console.log('alerts.test.mjs: all assertions passed');
