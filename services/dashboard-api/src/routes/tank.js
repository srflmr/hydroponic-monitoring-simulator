const express = require('express');
const { fetchTank, forwardTankRefill } = require('../clients/upstream');

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

module.exports = router;
