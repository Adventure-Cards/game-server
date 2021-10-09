import { IGame, CardLocation } from './types'

export function moveCardToStack(initialGame: IGame, cardId: string): IGame {
  const game = { ...initialGame }

  const card = game.players
    .map((player) => player.cards)
    .flat()
    .find((card) => card.id === cardId)

  if (!card) {
    throw new Error(`no card found with id ${cardId} while moving to stack`)
  }

  card.location = CardLocation.STACK

  return game
}

export function drawCard(initialGame: IGame, playerId: string): IGame {
  const game = { ...initialGame }

  const player = game.players.find((player) => player.id === playerId)
  if (!player) {
    throw new Error(`no player found with id ${playerId} while drawing card`)
  }

  const library = player.cards.filter((card) => card.location === CardLocation.LIBRARY)
  if (library.length < 1) {
    throw new Error(`tried to draw card but none left, ${playerId} loses`)
  }

  library[0].location = CardLocation.HAND

  return game
}

export function shuffle(arr: unknown[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
}

export function randomIntFromInterval(min: number, max: number): number {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}
