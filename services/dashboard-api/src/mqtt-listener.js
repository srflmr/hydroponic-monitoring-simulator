const mqtt = require('mqtt');
const { fetchTank, fetchLogs } = require('./clients/upstream');
const {
  broadcastZoneUpdate,
  broadcastTankUpdate,
  broadcastArbitrationLog,
} = require('./sockets/broadcast');

const SENSOR_TOPIC = 'hydroponic/+/sensor/reading';
const KOMANDO_TOPIC = 'hydroponic/+/aktuator/komando';

function startMqtt() {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL);

  client.on('connect', () => {
    client.subscribe([SENSOR_TOPIC, KOMANDO_TOPIC], (err) => {
      if (err) {
        console.error('dashboard-api subscribe failed:', err.message);
      }
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
      if (topic.endsWith('/sensor/reading')) {
        broadcastZoneUpdate({
          zone_id: payload.zone_id,
          ph: payload.ph,
          ec: payload.ec,
          water_temp_c: payload.water_temp_c,
          water_level_pct: payload.water_level_pct,
        });
      } else if (topic.endsWith('/aktuator/komando')) {
        const tank = await fetchTank();
        broadcastTankUpdate({
          current_volume: tank.current_volume,
          capacity: tank.capacity,
          percentage: tank.percentage,
        });
        const logs = await fetchLogs(1, 0);
        if (logs.logs && logs.logs.length > 0) {
          broadcastArbitrationLog(logs.logs[0]);
        }
      }
    } catch (err) {
      console.error('dashboard-api broadcast error:', err.message);
    }
  });

  return client;
}

module.exports = { startMqtt };
