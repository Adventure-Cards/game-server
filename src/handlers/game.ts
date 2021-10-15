import { Server, Socket } from 'socket.io'

import { store } from '../lib/store'

import { submitAction } from '../game'
import { IAction } from '../game/types'

interface IGameJoin {
  gameId: string
  address: string
}

interface IGameSubmitAction {
  gameId: string
  action: IAction
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  // handle players joining or re-joining the game
  socket.on('game:join', ({ gameId, address }: IGameJoin) => {
    console.log('game:join', { gameId, address })

    // TODO handle auth (verify that the socket.id is the specified address)

    // TODO handle error handling (game doesnt exist, etc)

    // join the "room" for this player (server will send updates only to this room)
    socket.join(`${gameId}-${address}`)
  })

  socket.on('game:action:submit', ({ gameId, action }: IGameSubmitAction) => {
    console.log('game:action:submit', { gameId, action })

    // validate priority, turn, etc
    store.games[gameId] = submitAction(store.games[gameId], action)
  })
}
