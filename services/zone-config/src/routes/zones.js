const express = require('express');
const { getActiveZones, getZoneById } = require('../db');

const router = express.Router();

router.get('/zones', async (req, res) => {
  try {
    const zones = await getActiveZones();
    return res.json(zones);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'service_unavailable', message: 'Database tidak tersedia' });
  }
});

router.get('/zones/:zoneId', async (req, res) => {
  try {
    const zone = await getZoneById(req.params.zoneId);
    if (!zone) {
      return res
        .status(404)
        .json({ error: 'zone_not_found', message: 'Zone tidak ditemukan' });
    }
    return res.json(zone);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'service_unavailable', message: 'Database tidak tersedia' });
  }
});

module.exports = router;
