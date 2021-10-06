import http from 'http'
import { Server, Socket } from 'socket.io'

import { registerConnectionHandlers } from '../handlers/connection'
import { registerRoomHandlers } from '../handlers/room'

export function createWebsocketServer(server: http.Server): Server {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  return io
}

export function registerEventHandlers(io: Server): void {
  const onConnection = (socket: Socket) => {
    console.log(socket.id, 'connected')

    registerConnectionHandlers(io, socket)
    registerRoomHandlers(io, socket)
  }

  io.on('connect', onConnection)
}
