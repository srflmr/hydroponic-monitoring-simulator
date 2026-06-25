const express = require('express');
const { fetchZones, fetchZoneCurrent, forwardZoneWrite } = require('../clients/upstream');
const { queryHistory } = require('../clients/influx');

const router = express.Router();

const ALLOWED_PARAMS = new Set(['ph', 'ec', 'water_temp_c', 'water_level_pct']);
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

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

router.get('/api/zones/:zoneId/history', async (req, res) => {
  const param = req.query.param || 'ec';
  if (!ALLOWED_PARAMS.has(param)) {
    return res.status(400).json({ error: 'invalid_param', message: 'param tidak dikenal' });
  }
  const { from, to } = req.query;
  if (from !== undefined && !ISO_RE.test(from)) {
    return res.status(400).json({ error: 'invalid_from', message: 'from harus ISO-8601 UTC' });
  }
  if (to !== undefined && !ISO_RE.test(to)) {
    return res.status(400).json({ error: 'invalid_to', message: 'to harus ISO-8601 UTC' });
  }
  try {
    const zones = await fetchZones();
    if (!zones.some((z) => z.zone_id === req.params.zoneId)) {
      return res.status(404).json({ error: 'zone_not_found', message: 'Zone tidak ditemukan' });
    }
    const start = from || '-1h';
    const points = await queryHistory(req.params.zoneId, param, start, to);
    return res.json({ zone_id: req.params.zoneId, param, points });
  } catch (err) {
    return res.status(503).json({ error: 'upstream_unavailable', message: err.message });
  }
});

router.post('/api/zones', async (req, res) => {
  try {
    const { status, body } = await forwardZoneWrite('POST', '/zones', req.body);
    return res.status(status).json(body);
  } catch (err) {
    return res.status(503).json({ error: 'upstream_unavailable', message: err.message });
  }
});

router.put('/api/zones/:zoneId', async (req, res) => {
  try {
    const { status, body } = await forwardZoneWrite('PUT', `/zones/${encodeURIComponent(req.params.zoneId)}`, req.body);
    return res.status(status).json(body);
  } catch (err) {
    return res.status(503).json({ error: 'upstream_unavailable', message: err.message });
  }
});

router.delete('/api/zones/:zoneId', async (req, res) => {
  try {
    const { status, body } = await forwardZoneWrite('DELETE', `/zones/${encodeURIComponent(req.params.zoneId)}`, undefined);
    return res.status(status).json(body);
  } catch (err) {
    return res.status(503).json({ error: 'upstream_unavailable', message: err.message });
  }
});

module.exports = router;
