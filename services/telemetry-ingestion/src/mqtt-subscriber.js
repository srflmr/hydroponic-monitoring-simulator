const mqtt = require('mqtt');
const { writeReading } = require('./influx-writer');
const { forwardReading } = require('./redis-forwarder');

const SENSOR_TOPIC = 'hydroponic/+/sensor/#';

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
    } catch (err) {
      console.error('Failed to process message:', err.message);
    }
  });

  return client;
}

module.exports = { startSubscriber, SENSOR_TOPIC };
