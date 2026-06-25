const express = require('express');
const { startSubscriber } = require('./mqtt-subscriber');
const { redis } = require('./redis-forwarder');
const { pingInflux } = require('./influx-writer');

const PORT = 3001;
const app = express();

const mqttClient = startSubscriber();

// Hard-fail (503) when any dependency is unreachable, per the project /health
// contract (a service is "ready" only when its own deps are). Nothing gates on
// this service's health, so an InfluxDB blip degrades only this report, not the
// chain — MQTT consumption and batched writes keep running regardless.
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
