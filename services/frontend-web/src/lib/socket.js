import { io } from 'socket.io-client';

// Connects to the page origin via Traefik+Authelia; the session cookie authorizes the WebSocket handshake.
export function connectSocket() {
  return io({ path: '/socket.io' });
}
