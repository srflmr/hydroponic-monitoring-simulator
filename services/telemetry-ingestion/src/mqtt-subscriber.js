const mqtt = require('mqtt');
const { writeReading } = require('./influx-writer');
const { forwardReading } = require('./redis-forwarder');

const SENSOR_TOPIC = 'hydroponic/+/sensor/reading';

function startSubscriber() {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });

  client.on('connect', () => {
    client.subscribe(SENSOR_TOPIC, (err) => {
      if (err) console.error('MQTT subscribe failed:', err.message);
    });
  });

  let processed = 0;
  const LOG_EVERY = Number(process.env.TELEMETRY_LOG_EVERY || 50);

  client.on('message', async (topic, message) => {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (err) {
      return;
    }
    try {
      writeReading(payload);
      await forwardReading(payload);
      processed += 1;
      if (LOG_EVERY > 0 && processed % LOG_EVERY === 0) {
        console.log(`telemetry-ingestion: ingested ${processed} readings (last zone=${payload.zone_id})`);
      }
    } catch (err) {
      console.error('Failed to process message:', err.message);
    }
  });

  return client;
}

module.exports = { startSubscriber, SENSOR_TOPIC };
