const express = require('express');
const { getActiveZones, getZoneById, createZone, updateZone, softDeleteZone } = require('../db');
const { validateZoneConfig } = require('../validate');

const router = express.Router();

router.get('/zones', async (req, res) => {
  try {
    const zones = await getActiveZones();
    return res.json(zones);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'service_unavailable', message: 'Database unavailable' });
  }
});

router.get('/zones/:zoneId', async (req, res) => {
  try {
    const zone = await getZoneById(req.params.zoneId);
    if (!zone) {
      return res
        .status(404)
        .json({ error: 'zone_not_found', message: 'Zone not found' });
    }
    return res.json(zone);
  } catch (err) {
    return res
      .status(503)
      .json({ error: 'service_unavailable', message: 'Database unavailable' });
  }
});

router.post('/zones', async (req, res) => {
  const errors = validateZoneConfig(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ error: 'validation_error', message: 'Invalid zone configuration', details: errors });
  }
  try {
    const existing = await getZoneById(req.body.zone_id);
    if (existing) {
      return res.status(409).json({ error: 'zone_exists', message: 'zone_id already exists' });
    }
    const zone = await createZone(req.body);
    return res.status(201).json(zone);
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'zone_exists', message: 'zone_id already exists' });
    }
    return res.status(503).json({ error: 'service_unavailable', message: 'Database unavailable' });
  }
});

router.put('/zones/:zoneId', async (req, res) => {
  try {
    const existing = await getZoneById(req.params.zoneId);
    if (!existing) {
      return res.status(404).json({ error: 'zone_not_found', message: 'Zone not found' });
    }
    const { zone_id, created_at, updated_at, is_active, ...editable } = req.body || {};
    const base = {
      ...existing,
      ph_min: Number(existing.ph_min), ph_max: Number(existing.ph_max),
      ec_min: Number(existing.ec_min), ec_max: Number(existing.ec_max),
      temp_min: Number(existing.temp_min), temp_max: Number(existing.temp_max),
      priority: Number(existing.priority),
    };
    const merged = { ...base, ...editable, zone_id: req.params.zoneId };
    const errors = validateZoneConfig(merged);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'validation_error', message: 'Invalid zone configuration', details: errors });
    }
    const updated = await updateZone(req.params.zoneId, merged);
    return res.json(updated);
  } catch (err) {
    return res.status(503).json({ error: 'service_unavailable', message: 'Database unavailable' });
  }
});

router.delete('/zones/:zoneId', async (req, res) => {
  try {
    const deleted = await softDeleteZone(req.params.zoneId);
    if (!deleted) {
      return res.status(404).json({ error: 'zone_not_found', message: 'Zone not found' });
    }
    return res.json({ status: 'deleted', zone_id: deleted.zone_id });
  } catch (err) {
    return res.status(503).json({ error: 'service_unavailable', message: 'Database unavailable' });
  }
});

module.exports = router;
