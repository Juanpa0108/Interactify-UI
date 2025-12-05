import { io, Socket } from 'socket.io-client';

/**
 * Use a sensible default for local development. If you prefer a custom URL,
 * set `window.__CHAT_URL__` before the app bootstraps or update this constant.
 */
const CHAT_URL = import.meta.env.VITE_CHAT_URL || (typeof window !== 'undefined' && (window as any).__CHAT_URL__) || 'http://localhost:3000';

let socket: Socket | null = null;

export function connectSocket() {
  if (!socket) {
    socket = io(CHAT_URL, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function getSocket() {
  if (!socket) return connectSocket();
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { connectSocket, getSocket, disconnectSocket };
