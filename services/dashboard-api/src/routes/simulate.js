const express = require('express');
const { fetchZones, postSimulate } = require('../clients/upstream');

const router = express.Router();

const ALLOWED_PARAMS = ['ph', 'ec', 'water_temp_c', 'water_level_pct'];

router.post('/api/simulate', async (req, res) => {
  const { zone_id: zoneId, param, value, duration_seconds: durationSeconds } = req.body || {};
  if (typeof zoneId !== 'string' || !ALLOWED_PARAMS.includes(param) || typeof value !== 'number') {
    return res.status(400).json({
      error: 'validation_error',
      message: 'zone_id (string), param (known), value (number) are required',
    });
  }
  try {
    const zones = await fetchZones();
    if (!zones.some((z) => z.zone_id === zoneId)) {
      return res.status(404).json({ error: 'zone_not_found', message: 'Zone not found' });
    }
    const result = await postSimulate(zoneId, param, value, durationSeconds);
    return res.json(result);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'upstream_unavailable', message: err.message });
  }
});

module.exports = router;
