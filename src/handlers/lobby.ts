import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

import { store } from '../lib/store'
import { IPlayerStatus, IGameStatus } from '../lib/game/types'

import { createGame, getGameStateForPlayer } from '../lib/game/index'

interface ILobbyGameCreate {
  address: string
}

interface ILobbyGameJoin {
  address: string
  gameId: string
}

interface ILobbyGameReady {
  address: string
  gameId: string
  deckId: number
}

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  socket.on('lobby:game:create', ({ address }: ILobbyGameCreate) => {
    console.log('lobby:game:create', { address })

    const existingGames = Object.entries(store.lobby.games)
      .map(([, game]) => game)
      .filter((game) => game.players.map((player) => player.address).includes(address))
    if (existingGames.length > 0) {
      console.warn(`address cannot create another game: ${address}`)
      return
    }

    const gameId = uuidv4()

    store.lobby.games[gameId] = {
      id: gameId,
      status: IGameStatus.NOT_STARTED,
      players: [
        {
          address: address,
          status: IPlayerStatus.JOINED,
          deckId: null,
        },
      ],
    }

    // join the socket room for this game
    socket.join(gameId)
  })

  socket.on('lobby:game:join', ({ address, gameId }: ILobbyGameJoin) => {
    console.log('lobby:game:join', { address, gameId })

    const game = store.lobby.games[gameId]
    if (!game) {
      console.warn(`game not found: ${gameId}`)
      return
    }

    if (game.status !== IGameStatus.NOT_STARTED) {
      console.warn(`tried to join a started game: ${gameId}`)
      return
    }

    if (game.players.map((player) => player.address).includes(address)) {
      console.warn(`tried to join a game twice: ${gameId}`)
      return
    }

    store.lobby.games[gameId].status = IGameStatus.PLAYERS_JOINED
    store.lobby.games[gameId].players.push({
      address: address,
      status: IPlayerStatus.JOINED,
      deckId: null,
    })

    // join the socket room for this game
    socket.join(gameId)
  })

  socket.on('lobby:game:ready', async ({ address, gameId, deckId }: ILobbyGameReady) => {
    console.log('lobby:game:ready', { address, gameId, deckId })

    const game = store.lobby.games[gameId]
    if (!game) {
      console.warn(`game not found: ${gameId}`)
      return
    }

    if (game.status !== IGameStatus.PLAYERS_JOINED) {
      console.warn(`tried to start a game with incorrect status: ${gameId}`)
      return
    }

    if (!game.players.map((player) => player.address).includes(address)) {
      console.warn(`tried to start a game that player is not part of: ${gameId}`)
      return
    }

    if (deckId < 0 || deckId > 8000) {
      console.warn(`tried to start a game with an invalid deckId: ${deckId}`)
      return
    }

    // update status and deckId
    store.lobby.games[gameId].players.forEach((player) => {
      if (player.address === address) {
        player.status = IPlayerStatus.READY
        player.deckId = deckId
      }
    })

    // now if both players are ready, start the game!
    if (
      store.lobby.games[gameId].players.filter((player) => player.status === IPlayerStatus.READY)
        .length === 2
    ) {
      // create game
      store.games[gameId] = await createGame(store.lobby.games[gameId])

      // start game!
      io.to(gameId).emit('game:start', gameId)

      // room-level timer to submit game state updates
      // const interval =
      setInterval(() => {
        const game = store.games[gameId]

        game.players.forEach((player) => {
          const gameStateForPlayer = getGameStateForPlayer(game, player.address)

          io.to(gameId).emit('game:update', gameStateForPlayer)
        })
      }, 500)

      // attach reference to interval for teardown later
      // store.games[gameId].interval = interval
    }
  })
}
