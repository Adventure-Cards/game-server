import http from 'http'
import { Server, Socket } from 'socket.io'

import { registerConnectionHandlers } from '../handlers/connection'
import { registerLobbyHandlers } from '../handlers/lobby'

import { store } from '../lib/store'

export function createWebsocketServer(server: http.Server): Server {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  // global timer to emit lobby updates
  setInterval(() => {
    io.sockets.emit('lobby:update', {
      games: store.games,
    })
  }, 1000)

  return io
}

export function registerEventHandlers(io: Server): void {
  const onConnection = (socket: Socket) => {
    console.log(socket.id, 'connected')

    registerConnectionHandlers(io, socket)
    registerLobbyHandlers(io, socket)
  }

  io.on('connection', onConnection)
}
