const express = require('express');
const { fetchZones, fetchZoneCurrent } = require('../clients/upstream');

const router = express.Router();

router.get('/api/zones', async (req, res) => {
  try {
    const zones = await fetchZones();
    const enriched = await Promise.all(
      zones.map(async (zone) => {
        let current = null;
        try {
          current = await fetchZoneCurrent(zone.zone_id);
        } catch (err) {
          current = null;
        }
        return {
          ...zone,
          status: current ? current.status : null,
          violated_params: current ? current.violated_params : [],
          last_reading: current ? current.last_reading : null,
        };
      }),
    );
    return res.json(enriched);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'upstream_unavailable', message: err.message });
  }
});

module.exports = router;
