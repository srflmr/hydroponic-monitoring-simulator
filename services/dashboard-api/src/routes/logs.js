const express = require('express');
const { fetchLogs } = require('../clients/upstream');

const router = express.Router();

router.get('/api/logs', async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 50, 200);
  const offset = Number.parseInt(req.query.offset, 10) || 0;
  try {
    const logs = await fetchLogs(limit, offset);
    return res.json(logs);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'upstream_unavailable', message: err.message });
  }
});

module.exports = router;
