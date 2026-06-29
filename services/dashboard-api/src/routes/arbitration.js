const express = require('express');
const { fetchPending } = require('../clients/upstream');

const router = express.Router();

router.get('/api/arbitration/pending', async (req, res) => {
  try {
    return res.json(await fetchPending());
  } catch (err) {
    return res.status(503).json({ error: 'upstream_unavailable', message: err.message });
  }
});

module.exports = router;
