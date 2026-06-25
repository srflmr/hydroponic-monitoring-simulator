// services/dashboard-api/src/clients/influx.js
const { InfluxDB } = require('@influxdata/influxdb-client');

const queryApi = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
}).getQueryApi(process.env.INFLUXDB_ORG);

const BUCKET = process.env.INFLUXDB_BUCKET;

// zoneId and param are caller-validated against allowlists; start/stop are
// caller-validated ISO-8601 or a safe duration literal. Safe to interpolate.
async function queryHistory(zoneId, param, start, stop) {
  const range = stop ? `range(start: ${start}, stop: ${stop})` : `range(start: ${start})`;
  const flux = `from(bucket: "${BUCKET}")
  |> ${range}
  |> filter(fn: (r) => r._measurement == "sensor_reading")
  |> filter(fn: (r) => r.zone_id == "${zoneId}")
  |> filter(fn: (r) => r._field == "${param}")
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)`;
  const points = [];
  for await (const { values, tableMeta } of queryApi.iterateRows(flux)) {
    const o = tableMeta.toObject(values);
    points.push({ timestamp: o._time, value: o._value });
  }
  return points;
}

module.exports = { queryHistory };
