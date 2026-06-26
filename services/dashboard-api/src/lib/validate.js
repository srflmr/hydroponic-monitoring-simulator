function isValidZoneId(zoneId, validZoneIds) {
  return typeof zoneId === 'string' && validZoneIds.includes(zoneId);
}

const ZONE_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
function isValidZoneIdFormat(zoneId) {
  return typeof zoneId === 'string' && ZONE_ID_RE.test(zoneId);
}

module.exports = { isValidZoneId, isValidZoneIdFormat };
