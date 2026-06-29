const express = require('express');
const { fetchTank, forwardTankRefill, forwardTankSet } = require('../clients/upstream');

const router = express.Router();

router.get('/api/tank', async (req, res) => {
  try {
    const tank = await fetchTank();
    return res.json(tank);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'upstream_unavailable', message: err.message });
  }
});

router.post('/api/tank/refill', async (req, res) => {
  try {
    const { status, body } = await forwardTankRefill(req.body);
    return res.status(status).json(body);
  } catch (err) {
    return res.status(503).json({ error: 'upstream_unavailable', message: err.message });
  }
});

router.post('/api/tank/set', async (req, res) => {
  const v = Number(req.body && req.body.volume);
  if (!Number.isFinite(v) || v < 0) {
    return res.status(400).json({ error: 'invalid_volume', message: 'volume harus angka >= 0' });
  }
  try {
    const { status, body } = await forwardTankSet({ volume: v });
    return res.status(status).json(body);
  } catch (err) {
    return res.status(503).json({ error: 'upstream_unavailable', message: err.message });
  }
});

module.exports = router;
