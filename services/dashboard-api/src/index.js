const http = require('http');
const express = require('express');
const zonesRouter = require('./routes/zones');
const tankRouter = require('./routes/tank');
const logsRouter = require('./routes/logs');
const simulateRouter = require('./routes/simulate');
const { initSockets } = require('./sockets/broadcast');
const { startMqtt } = require('./mqtt-listener');
const { pingInflux } = require('./clients/influx');

const PORT = 3010;
const app = express();

app.use(express.json());

const mqttClient = startMqtt();

app.get('/health', async (req, res) => {
  const checks = { mqtt: mqttClient.connected, influx: false, zoneConfig: false };
  await Promise.all([
    pingInflux().then(() => { checks.influx = true; }).catch(() => {}),
    fetch(`${process.env.ZONE_CONFIG_URL}/health`, { signal: AbortSignal.timeout(2000) })
      .then((r) => { checks.zoneConfig = r.ok; })
      .catch(() => {}),
  ]);
  const ok = checks.mqtt && checks.influx && checks.zoneConfig;
  return res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'unavailable', checks });
});

app.use(zonesRouter);
app.use(tankRouter);
app.use(logsRouter);
app.use(simulateRouter);
app.use(require('./routes/arbitration'));

const server = http.createServer(app);
initSockets(server);

server.listen(PORT, () => {
  console.log(`dashboard-api listening on ${PORT}`);
});
