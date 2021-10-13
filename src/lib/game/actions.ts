import {
  IGame,
  IPlayer,
  ICard,
  IAction,
  ActionType,
  EffectType,
  Target,
  ICostItem,
  IEffectItem,
  EffectExecutionType,
  AbilitySpeed,
  Phase,
  CardType,
  CostType,
  EffectItemType,
  CardLocation,
} from './types'

import { processEffectItem } from './effects'
import { validateCostItem, processCostItem } from './costs'

import { moveCardToStack } from './utils'

export function updateAvailableActionsForPlayers(initialGame: IGame): IGame {
  const game = { ...initialGame }

  for (const [, player] of Object.entries(game.players)) {
    let availableActions: IAction[] = []

    player.cards.forEach((card) => {
      card.actions = getActionsForCard(game, player, card)
    })

    if (game.hasPriority === player.id) {
      const releasePriorityAction: IAction = {
        type: ActionType.PRIORITY_ACTION,
        controllerId: player.id,
        costItems: [],
        effectItems: [
          {
            type: EffectItemType.CORE,
            controllerId: player.id,
            effect: {
              type: EffectType.RELEASE_PRIORITY,
              executionType: EffectExecutionType.IMMEDIATE,
            },
          },
        ],
      }
      availableActions = [...availableActions, releasePriorityAction]
    }

    // add effect actions here (look at top effect on stack and see if belongs to player?)

    player.availableActions = availableActions
  }

  return game
}

function getActionsForCard(game: IGame, player: IPlayer, card: ICard) {
  const actions: IAction[] = []

  // get opponent
  const opponent = game.players.find((_player) => _player.id !== player.id)
  if (!opponent) {
    throw new Error(`unable to find opponent for card: ${card.id}`)
  }

  // handle spell cast action
  if (
    card.type === CardType.SPELL &&
    card.location === CardLocation.HAND &&
    game.hasPriority === player.id
  ) {
    const castCostItem: ICostItem = {
      target: Target.PLAYER,
      playerId: player.id,
      cost: card.cost,
    }
    if (validateCostItem(game, castCostItem)) {
      actions.push({
        type: ActionType.CAST_ACTION,
        cardId: card.id,
        controllerId: player.id,
        costItems: [castCostItem],
        effectItems: [
          {
            type: EffectItemType.CAST,
            controllerId: player.id,
            effect: {
              executionType: EffectExecutionType.RESPONDABLE,
              type: EffectType.CAST,
            },
            cardId: card.id,
          },
        ],
      })
    }
  }

  // if its a spell, casting is the only possible action, so can return early
  if (card.type === CardType.SPELL) {
    return actions
  }

  // handle permanent cast action
  if (
    game.hasTurn === player.id &&
    game.hasPriority === player.id &&
    card.location === CardLocation.HAND &&
    game.phase === Phase.MAIN
  ) {
    const castCostItem: ICostItem = {
      target: Target.PLAYER,
      playerId: player.id,
      cost: card.cost,
    }

    if (validateCostItem(game, castCostItem)) {
      actions.push({
        type: ActionType.CAST_ACTION,
        cardId: card.id,
        controllerId: player.id,
        costItems: [castCostItem],
        effectItems: [
          {
            type: EffectItemType.CAST,
            controllerId: player.id,
            effect: {
              executionType: EffectExecutionType.RESPONDABLE,
              type: EffectType.CAST,
            },
            cardId: card.id,
          },
        ],
      })
    }
  }

  // handle permanent activated ability actions
  for (const ability of card.abilities) {
    // validate card is on battlefield
    if (card.location !== CardLocation.BATTLEFIELD) {
      continue
    }

    // validate ability speed
    let speedOk = false
    switch (ability.speed) {
      case AbilitySpeed.NORMAL:
        if (game.hasPriority === player.id && game.phase === Phase.MAIN) {
          speedOk = true
        }
        break
      default:
        throw new Error(`unhandled ability speed`)
    }
    if (!speedOk) {
      continue
    }

    // prepare and validate cost items
    const costItems: ICostItem[] = []
    for (const _cost of ability.costs) {
      const cost = { ..._cost }

      switch (cost.target) {
        case Target.PLAYER:
          costItems.push({
            cost: cost,
            target: cost.target,
            playerId: player.id,
          })
          break
        case Target.CARD:
          costItems.push({
            cost: cost,
            target: cost.target,
            cardId: card.id,
          })
          break
        default:
          throw new Error(`unhandled cost target`)
      }
    }

    let canAffordCosts = true
    for (const costItem of costItems) {
      if (!validateCostItem(game, costItem)) {
        canAffordCosts = false
        break
      }
    }
    if (!canAffordCosts) {
      continue
    }

    // prepare and submit effect items
    const effectItems: IEffectItem[] = []

    for (const _effect of ability.effects) {
      const effect = { ..._effect }

      switch (effect.type) {
        case EffectType.DAMAGE_ANY:
          effectItems.push({
            type: EffectItemType.WITH_AMOUNT,
            controllerId: player.id,
            effect: effect,
            amount: 1,
          })
          break
        default:
          throw new Error(`unhandled EffectType: ${effect.type}`)
      }
    }

    actions.push({
      type: ActionType.ABILITY_ACTION,
      abilityId: ability.id,
      cardId: card.id,
      controllerId: player.id,
      costItems: costItems,
      effectItems: effectItems,
    })
  }

  // handle attack action
  if (
    card.type === CardType.CREATURE &&
    card.location === CardLocation.BATTLEFIELD &&
    game.phase === Phase.ATTACKERS &&
    player.id === game.hasTurn
  ) {
    const attackCostItem: ICostItem = {
      cost: { target: Target.CARD, type: CostType.TAP },
      target: Target.CARD,
      cardId: card.id,
    }

    if (validateCostItem(game, attackCostItem)) {
      actions.push({
        type: ActionType.ATTACK_ACTION,
        cardId: card.id,
        controllerId: player.id,
        costItems: [attackCostItem],
        effectItems: [
          {
            type: EffectItemType.DECLARE_ATTACK,
            controllerId: player.id,
            cardId: card.id,
            effect: {
              executionType: EffectExecutionType.IMMEDIATE,
              type: EffectType.DECLARE_ATTACK,
              target: Target.PLAYER,
            },
          },
        ],
      })
    }
  }

  // // handle block action
  // if (
  //   card.type === CardType.CREATURE &&
  //   card.location === CardLocation.BATTLEFIELD &&
  //   game.phase === Phase.BLOCKERS &&
  //   player.id !== game.hasTurn
  // ) {
  //   actions.push({
  //     type: ActionType.BLOCK_ACTION,
  //     cardId: card.id,
  //     controllerId: player.id,
  //     costItems: [],
  //     effectItems: [
  //       {
  //         type: EffectItemType.DECLARE_BLOCK,
  //         controllerId: player.id,
  //         effect: {
  //           executionType: EffectExecutionType.IMMEDIATE,
  //           type: EffectType.DECLARE_BLOCK,
  //           target: Target.PLAYER,
  //         },
  //       },
  //     ],
  //   })
  // }

  return actions
}

export function submitAction(initialGame: IGame, action: IAction): IGame {
  let game = { ...initialGame }

  console.log('received action: ', action)

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

  // execute costs immediately (they never get added to the stack)
  for (const costItem of action.costItems) {
    game = processCostItem(game, costItem)
  }

  // handle effects based on execution type
  for (const effectItem of action.effectItems) {
    switch (effectItem.effect.executionType) {
      case EffectExecutionType.IMMEDIATE:
        console.log('processing effectItem immediately: ', effectItem)
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
  game = updateAvailableActionsForPlayers(game)

  return game
}
