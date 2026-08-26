import { io } from 'socket.io-client'

let socket = null

export function initProctorSocket() {
  if (!socket) {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/proctoring'
    socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to Proctoring Hub:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from Proctoring Hub')
    })
  }

  return socket
}

export function getProctorSocket() {
  if (!socket) {
    return initProctorSocket()
  }
  return socket
}
