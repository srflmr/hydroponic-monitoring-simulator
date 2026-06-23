const express = require('express');
const { fetchTank } = require('../clients/upstream');

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

module.exports = router;
