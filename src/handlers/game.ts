import { Server, Socket } from 'socket.io'

import { store } from '../lib/store'
import { submitAction } from '../lib/game'
import { IAction } from '../lib/game/types'

interface IGameSubmitAction {
  gameId: string
  action: IAction
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on('game:action:submit', ({ gameId, action }: IGameSubmitAction) => {
    console.log('game:action:submit', { gameId, action })

    // validate priority, turn, etc
    store.games[gameId] = submitAction(store.games[gameId], action)
  })
}
