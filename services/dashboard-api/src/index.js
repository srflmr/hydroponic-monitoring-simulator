const http = require('http');
const express = require('express');
const zonesRouter = require('./routes/zones');
const tankRouter = require('./routes/tank');
const logsRouter = require('./routes/logs');
const simulateRouter = require('./routes/simulate');
const { initSockets } = require('./sockets/broadcast');
const { startMqtt } = require('./mqtt-listener');

const PORT = 3010;
const app = express();

app.use(express.json());

const mqttClient = startMqtt();

app.get('/health', (req, res) => {
  if (mqttClient.connected) {
    return res.status(200).json({ status: 'ok' });
  }
  return res.status(503).json({ status: 'unavailable' });
});

app.use(zonesRouter);
app.use(tankRouter);
app.use(logsRouter);
app.use(simulateRouter);

const server = http.createServer(app);
initSockets(server);

server.listen(PORT, () => {
  console.log(`dashboard-api listening on ${PORT}`);
});
