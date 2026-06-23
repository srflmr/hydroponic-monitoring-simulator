const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
const TELEMETRY_QUEUE = 'queue:telemetry_for_evaluation';

async function forwardReading(payload) {
  await redis.lpush(TELEMETRY_QUEUE, JSON.stringify(payload));
}

module.exports = { redis, forwardReading, TELEMETRY_QUEUE };
