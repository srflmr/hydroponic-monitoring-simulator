const mqtt = require('mqtt');
const {
  broadcastZoneUpdate,
  broadcastTankUpdate,
  broadcastArbitrationLog,
  broadcastAlert,
  broadcastActuatorStatus,
  zoneNameFor,
} = require('./sockets/broadcast');

const SENSOR_TOPIC = 'hydroponic/+/sensor/reading';
const ARBITRATION_EVENT_TOPIC = 'hydroponic/+/arbitration/event';
const ACTUATOR_STATUS_TOPIC = 'hydroponic/+/actuator/status';

function startMqtt() {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });

  client.on('connect', () => {
    client.subscribe([SENSOR_TOPIC, ARBITRATION_EVENT_TOPIC, ACTUATOR_STATUS_TOPIC], (err) => {
      if (err) console.error('dashboard-api subscribe failed:', err.message);
    });
  });

  client.on('message', (topic, message) => {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (err) {
      return;
    }
    try {
      if (topic.endsWith('/sensor/reading')) {
        broadcastZoneUpdate({
          zone_id: payload.zone_id,
          ph: payload.ph,
          ec: payload.ec,
          water_temp_c: payload.water_temp_c,
          water_level_pct: payload.water_level_pct,
        });
      } else if (topic.endsWith('/arbitration/event')) {
        if (payload.log) {
          const name = zoneNameFor(payload.log.zone_id);
          broadcastArbitrationLog(name ? { ...payload.log, zone_name: name } : payload.log);
        }
        if (payload.tank) broadcastTankUpdate(payload.tank);
        if (payload.alert) broadcastAlert(payload.alert);
      } else if (topic.endsWith('/actuator/status')) {
        broadcastActuatorStatus(payload);
      }
    } catch (err) {
      console.error('dashboard-api broadcast error:', err.message);
    }
  });

  return client;
}

module.exports = { startMqtt };
