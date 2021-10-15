import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

import { store } from '../lib/store'

import { createGame, submitAction, getGameStateForPlaytest } from '../game'
import { IPlayerStatus, IGameStatus, IAction } from '../game/types'

interface IPlaytestGameCreate {
  deckId1: number
  deckId2: number
}

interface IPlaytestGameJoin {
  gameId: string
}

interface IPlaytestSubmitAction {
  gameId: string
  action: IAction
}

export function registerPlaytestHandlers(io: Server, socket: Socket): void {
  socket.on('playtest:game:create', async ({ deckId1, deckId2 }: IPlaytestGameCreate) => {
    const gameId = uuidv4()

    store.playtest[gameId] = {
      id: gameId,
      status: IGameStatus.NOT_STARTED,
      players: [
        {
          address: 'player1',
          status: IPlayerStatus.JOINED,
          deckId: deckId1,
        },
        {
          address: 'player2',
          status: IPlayerStatus.JOINED,
          deckId: deckId2,
        },
      ],
    }

    // create game
    store.games[gameId] = await createGame(store.playtest[gameId])

    // room-level timer to submit game state updates
    setInterval(() => {
      const game = store.games[gameId]
      const gameStateForPlaytest = getGameStateForPlaytest(game)
      io.to(`playtest-${gameId}`).emit('playtest:game:update', gameStateForPlaytest)
    }, 500)

    // join game
    socket.join(`playtest-${gameId}`)
    io.to(`playtest-${gameId}`).emit('playtest:game:start', gameId)
  })

  socket.on('playtest:game:join', ({ gameId }: IPlaytestGameJoin) => {
    console.log('playtest:game:join', { gameId })
    socket.join(`playtest-${gameId}`)
  })

  socket.on('playtest:game:action:submit', ({ gameId, action }: IPlaytestSubmitAction) => {
    console.log('game:action:submit', { gameId, action })

    // validate priority, turn, etc
    store.games[gameId] = submitAction(store.games[gameId], action)
  })
}
