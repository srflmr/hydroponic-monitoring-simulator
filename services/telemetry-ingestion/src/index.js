const express = require('express');
const { startSubscriber } = require('./mqtt-subscriber');
const { redis } = require('./redis-forwarder');
const { pingInflux } = require('./influx-writer');

const PORT = 3001;
const app = express();

const mqttClient = startSubscriber();

// 503 when any dependency is unreachable (project /health contract).
// An InfluxDB blip degrades history only; MQTT consumption and batched writes continue.
app.get('/health', async (req, res) => {
  const mqttReady = mqttClient.connected;
  const redisReady = redis.status === 'ready';
  const influxReady = await pingInflux();
  if (mqttReady && redisReady && influxReady) {
    return res.status(200).json({ status: 'ok' });
  }
  return res.status(503).json({ status: 'unavailable' });
});

app.listen(PORT, () => {
  console.log(`telemetry-ingestion listening on ${PORT}`);
});
