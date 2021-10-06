export type IGame = {
  id: string
  status: IGameStatus
  playerIds: string[]
}

export enum IGameStatus {
  STARTED = 'STARTED',
  NOT_STARTED = 'NOT_STARTED',
}

export interface IStore {
  games: IGame[]
}

const store: IStore = {
  games: [],
}

export { store }
