import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

import { store } from '../store/index'

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on('game:list', () => {
    socket.emit('room:list', {
      rooms: store.games,
    })
  })

  socket.on('game:join', ({ gameId }: { gameId: string }) => {
    console.log(socket.id, 'joined game', gameId)
    socket.join(gameId)
  })

  socket.on('game:create', () => {
    console.log(socket.id, 'created room')

    // generate gameId (uuid for now)
    const gameId = uuidv4()

    // add this gameId to the global store of active games
    store.games.push({
      id: gameId,
    })

    socket.emit('game:list', store.games)
  })
}
