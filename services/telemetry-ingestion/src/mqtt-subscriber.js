const mqtt = require('mqtt');
const { writeReading } = require('./influx-writer');
const { forwardReading } = require('./redis-forwarder');

const SENSOR_TOPIC = 'hydroponic/+/sensor/#';

function startSubscriber() {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL);

  client.on('connect', () => {
    client.subscribe(SENSOR_TOPIC);
  });

  client.on('message', async (topic, message) => {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (err) {
      return;
    }
    writeReading(payload);
    await forwardReading(payload);
  });

  return client;
}

module.exports = { startSubscriber, SENSOR_TOPIC };
