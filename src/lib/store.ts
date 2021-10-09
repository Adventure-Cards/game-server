import type { IGameMetadata, IGame } from './game/types'

export interface IStore {
  lobby: {
    games: { [gameId: string]: IGameMetadata }
  }
  games: { [gameId: string]: IGame }
}

const store: IStore = {
  lobby: {
    games: {},
  },
  games: {},
}

export { store }
