function isValidZoneId(zoneId, validZoneIds) {
  return typeof zoneId === 'string' && validZoneIds.includes(zoneId);
}

module.exports = { isValidZoneId };
