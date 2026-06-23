const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const influx = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});

const writeApi = influx.getWriteApi(
  process.env.INFLUXDB_ORG,
  process.env.INFLUXDB_BUCKET,
  'ms',
  { flushInterval: 2000, batchSize: 10 },
);

function writeReading(payload) {
  const point = new Point('sensor_reading')
    .tag('zone_id', payload.zone_id)
    .tag('device_id', payload.device_id)
    .floatField('ph', payload.ph)
    .floatField('ec', payload.ec)
    .floatField('water_temp_c', payload.water_temp_c)
    .floatField('water_level_pct', payload.water_level_pct);
  writeApi.writePoint(point);
}

module.exports = { writeReading };
