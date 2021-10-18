import { IGame, IAction, ActionType, EffectExecutionType } from '../types'

import { validateEffectItem } from '../effects/validate'
import { processEffectItem } from '../effects/process'
import { validateCostItem } from '../costs/validate'
import { processCostItem } from '../costs/process'

import { updateActions } from './update'
import { moveCardToStack } from '../utils/helpers'

export function submitAction(initialGame: IGame, action: IAction): IGame {
  let game = { ...initialGame }

  console.log('received action: ', action.type)

  // get the player object who submitted the action
  const player = game.players.find((player) => player.id === action.controllerId)
  if (!player) {
    throw new Error(`unable to find player with id ${action.controllerId}`)
  }

  // validate that costItems can be paid
  for (const costItem of action.costItems) {
    if (!validateCostItem(game, costItem)) {
      console.error(`
        oh no! you tried to submit an action that had costItems
        you could not pay for. that isnt supposed to happen!
      `)
      return game
    }
  }

  // validate that effectItems are possible (think targets, etc)
  for (const effectItem of action.effectItems) {
    if (!validateEffectItem(game, effectItem)) {
      console.error(`
          oh no! you tried to submit an action that had effectItems
          that are invalid. that isnt supposed to happen!
        `)
      return game
    }
  }

  // execute costs immediately (they never get added to the stack)
  for (const costItem of action.costItems) {
    game = processCostItem(game, costItem)
  }

  // handle effects based on execution type
  for (const effectItem of action.effectItems) {
    switch (effectItem.executionType) {
      case EffectExecutionType.IMMEDIATE:
        game = processEffectItem(game, effectItem)
        break
      case EffectExecutionType.RESPONDABLE: {
        // if its a casting action, must move card location to stack
        if (action.type === ActionType.CAST_ACTION) {
          game = moveCardToStack(game, action.cardId)
        }

        // now add the card effect to the stack
        game.stack.push({
          controllerId: action.controllerId,
          effectItem: effectItem,
        })

        // and finally pass priority to the other player
        const castingPlayer = game.players.find((player) => player.id === action.controllerId)
        const respondingPlayer = game.players.find((player) => player.id !== action.controllerId)
        if (!castingPlayer || !respondingPlayer) {
          throw new Error(`unable to find castingPlayer/respondingPlayer players`)
        }
        game.hasPriority = respondingPlayer.id

        break
      }
      default:
        throw new Error('unhandled effect execution type')
    }
  }

  // update available actions to reflect changes made while paying costs
  // and possible effects added to stack
  game = updateActions(game)

  return game
}
