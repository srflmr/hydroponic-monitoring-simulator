import test from 'node:test';
import assert from 'node:assert';
import { pendingToQueue } from './sim-pending.js';

test('pendingToQueue builds queue objects and one warning alert per pending zone', () => {
  const { queue, alerts } = pendingToQueue({ pending: [
    { request_id: 'r1', zone_id: 'zone-b', score: 0.5 },
    { request_id: 'r2', zone_id: 'zone-c', score: 0.3 },
  ], total: 2 });
  assert.deepEqual(queue, [{ zone_id: 'zone-b', score: 0.5 }, { zone_id: 'zone-c', score: 0.3 }]);
  assert.equal(alerts.length, 2);
  assert.equal(alerts.every((a) => a.zone_id && a.severity === 'warning'), true);
});

test('pendingToQueue tolerates empty/missing', () => {
  assert.deepEqual(pendingToQueue(null), { queue: [], alerts: [] });
  assert.deepEqual(pendingToQueue({ pending: [] }), { queue: [], alerts: [] });
});
