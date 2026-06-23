const express = require('express');
const { getActiveZones, getZoneById } = require('../db');

const router = express.Router();

router.get('/zones', async (req, res) => {
  const zones = await getActiveZones();
  return res.json(zones);
});

router.get('/zones/:zoneId', async (req, res) => {
  const zone = await getZoneById(req.params.zoneId);
  if (!zone) {
    return res
      .status(404)
      .json({ error: 'zone_not_found', message: 'Zone tidak ditemukan' });
  }
  return res.json(zone);
});

module.exports = router;
