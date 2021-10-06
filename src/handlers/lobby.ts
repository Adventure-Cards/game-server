import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

import { IGameStatus, store } from '../lib/store'

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  socket.on('game:create', ({ address }: { address: string }) => {
    console.log(address, 'created game')

    store.games.push({
      id: uuidv4(),
      status: IGameStatus.NOT_STARTED,
      playerIds: [address],
    })
  })

  socket.on('game:join', ({ address, gameId }: { address: string; gameId: string }) => {
    console.log(address, 'joined game', gameId)

    const game = store.games.find((game) => game.id === gameId)
    if (!game) {
      console.warn(`game not found: ${gameId}`)
      return
    }

    if (game.status === IGameStatus.STARTED) {
      console.warn(`tried to join game in progress ${gameId}`)
      return
    }

    store.games.forEach((game) => {
      if (game.id === gameId) {
        game.status = IGameStatus.STARTED
        game.playerIds.push(address)
      }
    })
  })
}
