import { IGame, Target, CostType, ICost, ICostItem } from '../types'

export function processCostItem(initialGame: IGame, costItem: ICostItem): IGame {
  let game = { ...initialGame }

  switch (costItem.target) {
    case Target.PLAYER:
      game = processCostPlayer(game, costItem.cost, costItem.playerId)
      break
    case Target.CARD:
      game = processCostCard(game, costItem.cost, costItem.cardId)
      break
    default:
      throw new Error(`unhandled CostTarget`)
  }

  return game
}

function processCostPlayer(initialGame: IGame, cost: ICost, playerId: string): IGame {
  const game = { ...initialGame }

  const player = game.players.find((player) => player.id === playerId)
  if (!player) {
    throw new Error(`no player found with id ${playerId} while paying CostItem`)
  }

  switch (cost.type) {
    case CostType.MANA:
      player.currentMana -= cost.amount
      break
    default:
      throw new Error(`unhandled CostTarget`)
  }

  return game
}

function processCostCard(initialGame: IGame, cost: ICost, cardId: string): IGame {
  const game = { ...initialGame }

  const card = game.players
    .map((player) => player.cards)
    .flat()
    .find((card) => card.id === cardId)

  if (!card) {
    throw new Error(`no card found with id ${cardId} while paying CostItem`)
  }

  switch (cost.type) {
    case CostType.TAP:
      card.tapped = true
      break
    default:
      throw new Error(`unhandled CostTarget`)
  }

  return game
}
