import { io } from 'socket.io-client';

// Connects to the current page origin (https://hydroponic.localhost) through
// Traefik+Authelia; the session cookie authorizes the WebSocket handshake.
export function connectSocket() {
  return io({ path: '/socket.io' });
}
