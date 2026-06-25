const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function getActiveZones() {
  const result = await pool.query(
    'SELECT * FROM zones WHERE is_active = true ORDER BY priority DESC',
  );
  return result.rows;
}

async function getZoneById(zoneId) {
  const result = await pool.query(
    'SELECT * FROM zones WHERE zone_id = $1 AND is_active = true',
    [zoneId],
  );
  return result.rows[0] || null;
}

async function ping() {
  await pool.query('SELECT 1');
}

const ZONE_COLUMNS = ['zone_id', 'name', 'ph_min', 'ph_max', 'ec_min', 'ec_max', 'temp_min', 'temp_max', 'priority'];

async function createZone(cfg) {
  const values = ZONE_COLUMNS.map((c) => cfg[c]);
  const placeholders = ZONE_COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(
    `INSERT INTO zones (${ZONE_COLUMNS.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return result.rows[0];
}

async function updateZone(zoneId, cfg) {
  // cfg is the merged full config; zone_id is immutable, so update the rest.
  const cols = ZONE_COLUMNS.filter((c) => c !== 'zone_id');
  const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const values = cols.map((c) => cfg[c]);
  const result = await pool.query(
    `UPDATE zones SET ${setClause}, updated_at = now() WHERE zone_id = $${cols.length + 1} AND is_active = true RETURNING *`,
    [...values, zoneId],
  );
  return result.rows[0] || null;
}

async function softDeleteZone(zoneId) {
  const result = await pool.query(
    'UPDATE zones SET is_active = false, updated_at = now() WHERE zone_id = $1 AND is_active = true RETURNING zone_id',
    [zoneId],
  );
  return result.rows[0] || null;
}

module.exports = { pool, getActiveZones, getZoneById, createZone, updateZone, softDeleteZone, ping };
