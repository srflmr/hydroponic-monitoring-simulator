const express = require('express');
const { fetchLogs } = require('../clients/upstream');

const router = express.Router();

router.get('/api/logs', async (req, res) => {
  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Math.min(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 200);
  const parsedOffset = Number.parseInt(req.query.offset, 10);
  const offset = Math.max(0, Number.isNaN(parsedOffset) ? 0 : parsedOffset);
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
