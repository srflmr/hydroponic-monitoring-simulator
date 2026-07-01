// services/frontend-web/test/mappers.test.mjs
import assert from 'node:assert';
import { mapZone, mapTank, mapLog, splitName, fmtTime } from '../src/lib/mappers.js';

assert.deepStrictEqual(splitName('Zona A - Kangkung'), { name: 'Zona A', crop: 'Kangkung' });
assert.deepStrictEqual(splitName('Greenhouse'), { name: 'Greenhouse', crop: 'Greenhouse' });

// fmtTime: converts UTC ISO timestamp to local wall-clock time (explicit tz for determinism)
assert.strictEqual(fmtTime('2026-06-25T10:18:00Z', 'Asia/Jakarta'), '17:18:00', 'WIB is UTC+7');
assert.strictEqual(fmtTime('2026-06-25T10:18:00Z', 'UTC'), '10:18:00', 'UTC passthrough when tz=UTC explicitly');
assert.strictEqual(fmtTime('', 'UTC'), '', 'empty input returns empty string');
assert.strictEqual(fmtTime(null, 'UTC'), '', 'null input returns empty string');

const apiZone = {
  zone_id: 'zone-a', name: 'Zona A - Kangkung', priority: 8,
  ph_min: 5.5, ph_max: 6.5, ec_min: 1.5, ec_max: 2.5, temp_min: 22, temp_max: 28,
  last_reading: { ph: 6.1, ec: 1.95, water_temp_c: 25.2, water_level_pct: 90 },
};
const z = mapZone(apiZone);
assert.strictEqual(z.id, 'zone-a');
assert.strictEqual(z.crop, 'Kangkung');
assert.strictEqual(z.temp, 25.2);     // water_temp_c -> temp
assert.strictEqual(z.level, 90);      // water_level_pct -> level
assert.strictEqual(z.th.ecMin, 1.5);  // ec_min -> th.ecMin
assert.strictEqual(z.priority, 8);

const zNo = mapZone({ ...apiZone, last_reading: null });
assert.strictEqual(zNo.ec, 2.0, 'missing reading defaults ec to th midpoint (1.5+2.5)/2');

assert.deepStrictEqual(mapTank({ current_volume: 142.5, capacity: 200 }), { volume: 142.5, capacity: 200 });

const log = mapLog({ id: 'x', zone_id: 'zone-a', requested_at: '2026-06-25T10:18:00Z', decision: 'fulfilled', reason: 'served' });
assert.strictEqual(log.decision, 'fulfilled');
assert.match(log.time, /^\d{2}:\d{2}:\d{2}$/, 'mapLog time is HH:MM:SS shaped (exact value depends on local tz, verified separately above)');
console.log('mappers.test.js: all assertions passed');
