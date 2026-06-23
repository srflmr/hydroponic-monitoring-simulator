const express = require('express');
const zonesRouter = require('./routes/zones');
const { ping } = require('./db');

const PORT = 3003;
const app = express();

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await ping();
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(503).json({ status: 'unavailable' });
  }
});

app.use(zonesRouter);

app.listen(PORT, () => {
  console.log(`zone-config listening on ${PORT}`);
});
