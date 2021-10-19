import { IGame, ICostItem, CostItemType } from '../types'

export function validateCostItem(initialGame: IGame, costItem: ICostItem): boolean {
  const game = { ...initialGame }

  const player = game.players.find((player) => player.id === costItem.controllerId)
  if (!player) {
    throw new Error(`player with id ${costItem.controllerId} not found`)
  }

  switch (costItem.type) {
    case CostItemType.MANA: {
      if (player.currentMana < costItem.arguments.amount) {
        return false
      }
      break
    }
    case CostItemType.TAP: {
      const card = game.players
        .map((player) => player.cards)
        .flat()
        .find((card) => card.id === costItem.arguments.cardId)
      if (!card) {
        throw new Error(`no card found with id ${costItem.arguments.cardId} while paying CostItem`)
      }
      if (card.tapped) {
        return false
      }
      break
    }
    default:
      throw new Error(`unhandled CostTarget`)
  }

  return true
}
