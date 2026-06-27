const Redis = require('ioredis');

// enableReadyCheck disabled: the least-privilege Redis ACL user does not grant
// the INFO command, which the ready-check would otherwise call (and log a NOPERM
// warning on). Connection readiness is unaffected; LPUSH works regardless.
const redis = new Redis(process.env.REDIS_URL, { enableReadyCheck: false });
const TELEMETRY_QUEUE = 'queue:telemetry_for_evaluation';

async function forwardReading(payload) {
  await redis.lpush(TELEMETRY_QUEUE, JSON.stringify(payload));
}

module.exports = { redis, forwardReading, TELEMETRY_QUEUE };
