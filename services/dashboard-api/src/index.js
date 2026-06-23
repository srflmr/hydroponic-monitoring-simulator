const express = require('express');
const zonesRouter = require('./routes/zones');
const tankRouter = require('./routes/tank');
const logsRouter = require('./routes/logs');
const simulateRouter = require('./routes/simulate');

const PORT = 3010;
const app = express();

app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use(zonesRouter);
app.use(tankRouter);
app.use(logsRouter);
app.use(simulateRouter);

app.listen(PORT, () => {
  console.log(`dashboard-api listening on ${PORT}`);
});
