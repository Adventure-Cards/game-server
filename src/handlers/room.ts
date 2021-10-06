import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

import { store } from '../store/index'

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on('room:list', () => {
    socket.emit('room:list', {
      rooms: store.rooms,
    })
  })

  socket.on('room:join', ({ roomId }: { roomId: string }) => {
    console.log(socket.id, 'joined room', roomId)
    socket.join(roomId)
  })

  socket.on('room:create', () => {
    console.log(socket.id, 'created room')

    // generate gameId (uuid for now)
    const roomId = uuidv4()

    // add this gameId to the global store of active games
    store.rooms.push({
      id: roomId,
    })

    socket.emit('room:list', store.rooms)
  })
}
