import type { IGameMetadata, IGame } from '../game/types'

export interface IStore {
  lobby: { [gameId: string]: IGameMetadata }
  playtest: { [gameId: string]: IGameMetadata }
  games: { [gameId: string]: IGame }
}

const store: IStore = {
  lobby: {},
  playtest: {},
  games: {},
}

export { store }
