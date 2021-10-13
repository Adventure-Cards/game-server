import { Server, Socket } from 'socket.io'

export function registerConnectionHandlers(io: Server, socket: Socket): void {
  socket.on('disconnect', () => {
    console.log(socket.id, 'disconnected')

    socket.removeAllListeners()
  })

  socket.on('disconnecting', () => {
    console.log(socket.id, 'disconnecting from rooms: ', socket.rooms)
  })
}
