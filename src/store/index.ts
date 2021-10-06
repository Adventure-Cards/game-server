export type IRoom = {
  id: string
}

export interface IStore {
  rooms: IRoom[]
}

const store: IStore = {
  rooms: [],
}

export { store }
