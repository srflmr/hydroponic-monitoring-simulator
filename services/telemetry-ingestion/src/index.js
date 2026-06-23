const express = require('express');
const { startSubscriber } = require('./mqtt-subscriber');
const { redis } = require('./redis-forwarder');

const PORT = 3001;
const app = express();

const mqttClient = startSubscriber();

app.get('/health', (req, res) => {
  const mqttReady = mqttClient.connected;
  const redisReady = redis.status === 'ready';
  if (mqttReady && redisReady) {
    return res.status(200).json({ status: 'ok' });
  }
  return res.status(503).json({ status: 'unavailable' });
});

app.listen(PORT, () => {
  console.log(`telemetry-ingestion listening on ${PORT}`);
});
