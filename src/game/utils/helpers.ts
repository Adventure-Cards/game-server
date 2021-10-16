import { IGame, CardType, CardLocation } from '../types'

export function processCombatDamage(initialGame: IGame): IGame {
  const game = { ...initialGame }

  const activeAttackCards = game.players
    .map((player) => player.cards)
    .flat()
    .filter((card) => card.activeAttack !== null)

  const activeBlockCards = game.players
    .map((player) => player.cards)
    .flat()
    .filter((card) => card.activeBlock !== null)

  for (const activeAttackCard of activeAttackCards) {
    // get defending player
    const defendingPlayer = game.players.find(
      (player) => player.id === activeAttackCard.activeAttack?.defendingPlayerId
    )
    if (!defendingPlayer) {
      throw new Error(`unable to find defendingPlayer`)
    }

    // find corresponding blocks
    // TODO sort by "blockIndex"
    const blockers = activeBlockCards.filter(
      (card) => card.activeBlock?.attackingCardId === activeAttackCard.id
    )

    let remainingDamage = activeAttackCard.type === CardType.CREATURE ? activeAttackCard.attack : 0

    for (const blocker of blockers) {
      const blockerDefense = blocker.type == CardType.CREATURE ? blocker.defense : 0

      if (remainingDamage >= blockerDefense) {
        // blocker dies!
        blocker.location === CardLocation.GRAVEYARD
      }

      remainingDamage -= blockerDefense
    }

    defendingPlayer.life -= Math.max(remainingDamage, 0)

    // remove activeAttack
    activeAttackCard.activeAttack = null
  }

  return game
}

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
