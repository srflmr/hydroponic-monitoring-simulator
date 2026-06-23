const express = require('express');
const { postSimulate } = require('../clients/upstream');

const router = express.Router();

const VALID_ZONE_IDS = ['zone-a', 'zone-b', 'zone-c'];
const ALLOWED_PARAMS = ['ph', 'ec', 'water_temp_c', 'water_level_pct'];

router.post('/api/simulate', async (req, res) => {
  const { zone_id: zoneId, param, value, duration_seconds: durationSeconds } = req.body || {};
  if (!VALID_ZONE_IDS.includes(zoneId) || !ALLOWED_PARAMS.includes(param) || typeof value !== 'number') {
    return res.status(400).json({
      error: 'validation_error',
      message: 'zone_id (zone-a/b/c), param (known), value (number) wajib diisi',
    });
  }
  try {
    const result = await postSimulate(zoneId, param, value, durationSeconds);
    return res.json(result);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'upstream_unavailable', message: err.message });
  }
});

module.exports = router;
