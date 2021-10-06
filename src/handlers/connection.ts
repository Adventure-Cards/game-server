import { Server, Socket } from 'socket.io'

import { store } from '../lib/store'

export function registerConnectionHandlers(io: Server, socket: Socket): void {
  const interval = setInterval(() => {
    socket.emit('store:update', store)
  }, 1000)

  socket.on('disconnect', () => {
    console.log(socket.id, 'disconnected')

    socket.removeAllListeners()
    clearInterval(interval)
  })

  socket.on('disconnecting', () => {
    console.log(socket.id, 'disconnecting from rooms: ', socket.rooms)
  })
}
