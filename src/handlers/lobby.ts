import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

import { IGameStatus, store } from '../lib/store'

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  socket.on('game:create', () => {
    console.log(socket.id, 'created game')

    store.games.push({
      id: uuidv4(),
      status: IGameStatus.NOT_STARTED,
      playerIds: [socket.id],
    })
  })

  socket.on('game:join', ({ gameId }: { gameId: string }) => {
    console.log(socket.id, 'joined game', gameId)

    store.games.forEach((game) => {
      if (game.id === gameId) {
        game.playerIds.push(socket.id)
      }
    })
  })
}
