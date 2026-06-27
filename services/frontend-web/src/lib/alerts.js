// Pure reducers for the dashboard alert list.
// alert shape: { zone_id, message, severity }  (severity: 'critical' | 'warning')

export function upsertAlert(alerts, alert) {
  if (!alert || !alert.zone_id) return alerts;
  const rest = alerts.filter((a) => a.zone_id !== alert.zone_id);
  return [...rest, { zone_id: alert.zone_id, message: alert.message, severity: alert.severity }];
}

export function clearAlertForZone(alerts, zoneId) {
  return alerts.filter((a) => a.zone_id !== zoneId);
}
