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

module.exports = { pool, getActiveZones, getZoneById, ping };
