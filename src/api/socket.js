import { io } from 'socket.io-client'

let socket = null

export function initProctorSocket() {
  if (!socket) {
    let rawUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4010/proctoring'
    
    // Normalize ws:// or wss:// protocols to http:// or https:// for Socket.IO namespace connection
    let normalizedUrl = rawUrl
      .replace(/^ws:\/\//i, 'http://')
      .replace(/^wss:\/\//i, 'https://')
      
    // Ensure default port is 4010 if localhost is used without port
    if (normalizedUrl.includes('localhost') && !normalizedUrl.match(/:\d+/)) {
      normalizedUrl = normalizedUrl.replace('localhost', 'localhost:4010')
    }

    console.log('[WebSocket] Connecting to Proctoring Hub at:', normalizedUrl)

    socket = io(normalizedUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to Proctoring Hub successfully. Socket ID:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.warn('[WebSocket] Connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected from Proctoring Hub. Reason:', reason)
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
