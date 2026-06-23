const { Server } = require('socket.io');
const { isValidZoneId } = require('../lib/validate');
const { fetchZones } = require('../clients/upstream');

const VALID_ZONES_REFRESH_MS = 30000;

let io = null;
let validZoneIds = ['zone-a', 'zone-b', 'zone-c'];

async function refreshValidZones() {
  try {
    const zones = await fetchZones();
    validZoneIds = zones.map((zone) => zone.zone_id);
  } catch (err) {
    // Keep the previous list on a transient upstream failure.
  }
}

function initSockets(httpServer) {
  io = new Server(httpServer, { path: '/socket.io', cors: { origin: '*' } });
  refreshValidZones();
  setInterval(refreshValidZones, VALID_ZONES_REFRESH_MS);

  io.on('connection', (socket) => {
    socket.on('subscribe:zone', (payload) => {
      const zoneId = payload && payload.zone_id;
      if (!isValidZoneId(zoneId, validZoneIds)) {
        socket.emit('subscribe:error', {
          error: 'invalid_zone',
          message: 'zone_id tidak valid',
        });
        return;
      }
      socket.join(`zone:${zoneId}`);
      socket.emit('subscribed', { zone_id: zoneId });
    });
  });

  return io;
}

function broadcastZoneUpdate(reading) {
  if (io) {
    io.emit('zone:update', reading);
  }
}

function broadcastTankUpdate(tank) {
  if (io) {
    io.emit('tank:update', tank);
  }
}

function broadcastArbitrationLog(log) {
  if (io) {
    io.emit('arbitration:log', log);
  }
}

module.exports = {
  initSockets,
  broadcastZoneUpdate,
  broadcastTankUpdate,
  broadcastArbitrationLog,
};
