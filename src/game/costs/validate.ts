import { IGame, Target, CostType, ICost, ICostItem } from '../types'

export function validateCostItem(game: IGame, costItem: ICostItem): boolean {
  switch (costItem.target) {
    case Target.PLAYER:
      return validateCostPlayer(game, costItem.cost, costItem.playerId)
    case Target.CARD:
      return validateCostCard(game, costItem.cost, costItem.cardId)
    default:
      throw new Error(`unhandled CostTarget`)
  }
}

function validateCostPlayer(game: IGame, cost: ICost, playerId: string): boolean {
  const player = game.players.find((player) => player.id === playerId)
  if (!player) {
    throw new Error(`no player found with id ${playerId} while paying CostItem`)
  }

  switch (cost.type) {
    case CostType.MANA:
      if (player.currentMana < cost.amount) {
        return false
      }
      break
    default:
      throw new Error(`unhandled CostTarget`)
  }

  return true
}

function validateCostCard(game: IGame, cost: ICost, cardId: string): boolean {
  const card = game.players
    .map((player) => player.cards)
    .flat()
    .find((card) => card.id === cardId)

  if (!card) {
    throw new Error(`no card found with id ${cardId} while paying CostItem`)
  }

  switch (cost.type) {
    case CostType.TAP:
      if (card.tapped) {
        return false
      }
      break
    default:
      throw new Error(`unhandled CostTarget`)
  }

  return true
}
