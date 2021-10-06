export type IGame = {
  id: string
}

export interface IStore {
  games: IGame[]
}

const store: IStore = {
  games: [],
}

export { store }
