const express = require('express');
const { fetchLogs, fetchZones } = require('../clients/upstream');

const router = express.Router();

router.get('/api/logs', async (req, res) => {
  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Math.min(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 200);
  const parsedOffset = Number.parseInt(req.query.offset, 10);
  const offset = Math.max(0, Number.isNaN(parsedOffset) ? 0 : parsedOffset);
  try {
    const [logsData, zones] = await Promise.all([fetchLogs(limit, offset), fetchZones()]);
    const nameById = Object.fromEntries(zones.map((z) => [z.zone_id, z.name]));
    const enriched = logsData.logs.map((row) => ({ ...row, zone_name: nameById[row.zone_id] ?? null }));
    return res.json({ ...logsData, logs: enriched });
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'upstream_unavailable', message: err.message });
  }
});

module.exports = router;
