import {
  IGame,
  IPlayer,
  ICard,
  IAction,
  ICostItem,
  IEffectItem,
  Phase,
  AbilitySpeed,
  ActionType,
  CardType,
  EffectItemType,
  CardLocation,
  ExecutionType,
  CostItemType,
} from '../types'

// import { validateEffectItem } from '../effects'
import { validateCostItem } from '../costs/validate'

export function updateActions(initialGame: IGame): IGame {
  const game = { ...initialGame }

  for (const player of Object.values(game.players)) {
    let availableActions: IAction[] = []

    player.cards.forEach((card) => {
      card.actions = getActionsForCard(game, player, card)
    })

    if (game.hasPriority === player.id) {
      const passPriorityEffectItem: IEffectItem = {
        type: EffectItemType.PASS_PRIORITY,
        executionType: ExecutionType.IMMEDIATE,
        arguments: {
          playerId: player.id,
        },
      }
      const passPriorityAction: IAction = {
        type: ActionType.PRIORITY_ACTION,
        controllerId: player.id,
        costItems: [],
        effectItems: [passPriorityEffectItem],
      }

      availableActions = [...availableActions, passPriorityAction]
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
      type: CostItemType.MANA,
      controllerId: player.id,
      arguments: {
        amount: card.cost,
      },
    }

    // this effect item needs to be built based on data from the card
    // could be very complex logic based on arguments, will need to break out into helper
    // what are some basic spell arguments?
    // 1) target(s) (player, card on [stack, battlefield, graveyard, hand])
    // 2) amount (number)
    // 3) option (choose one - ...)

    // then, the effect handler for this effectItem will dispatch some number of non-respondable effects
    // propagating arguments where appropriate

    const castEffectItem: IEffectItem = {
      type: EffectItemType.CAST_SPELL,
      executionType: ExecutionType.RESPONDABLE,
      arguments: {
        cardId: card.id,
      },
    }

    const staticArguments = card.effectTemplates.reduce((acc, effectTemplate) => {
      return { ...acc, ...effectTemplate.arguments }
    }, {})

    // const userArguments = card.effectTemplates.reduce((acc, effectTemplate) => {
    //   return { ...acc, ...effectTemplate.arguments }
    // }, {})

    // const emptyArguments = Object.keys(castAction.arguments).filter(
    //   (key) => castAction.arguments![key] === null
    // )

    if (validateCostItem(game, castCostItem)) {
      actions.push({
        type: ActionType.CAST_ACTION,
        cardId: card.id,
        controllerId: player.id,
        costItems: [castCostItem],
        effectItems: [castEffectItem],
        arguments: staticArguments,
      })
    }
  }

  // if its a spell, casting is the only possible action, so return early
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
      type: CostItemType.MANA,
      controllerId: player.id,
      arguments: {
        amount: card.cost,
      },
    }
    const castEffectItem: IEffectItem = {
      type: EffectItemType.CAST_PERMANENT,
      executionType: ExecutionType.RESPONDABLE,
      arguments: {
        cardId: card.id,
      },
    }

    if (validateCostItem(game, castCostItem)) {
      actions.push({
        type: ActionType.CAST_ACTION,
        cardId: card.id,
        controllerId: player.id,
        costItems: [castCostItem],
        effectItems: [castEffectItem],
      })
    }
  }

  // if card is on battlefield, create actions for activated abilities
  if (card.location !== CardLocation.BATTLEFIELD) {
    for (const ability of card.abilities) {
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
      // for (const _cost of ability.costs) {
      //   const cost = { ..._cost }

      //   switch (cost.target) {
      //     case Target.PLAYER:
      //       costItems.push({
      //         cost: cost,
      //         target: cost.target,
      //         playerId: player.id,
      //       })
      //       break
      //     case Target.CARD:
      //       costItems.push({
      //         cost: cost,
      //         target: cost.target,
      //         cardId: card.id,
      //       })
      //       break
      //     default:
      //       throw new Error(`unhandled cost target`)
      //   }
      // }

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

      // for (const _effect of ability.effects) {
      //   const effect = { ..._effect }

      //   switch (effect.type) {
      //     default:
      //       throw new Error(`unhandled EffectType: ${effect.type}`)
      //   }
      // }

      actions.push({
        type: ActionType.ABILITY_ACTION,
        abilityId: ability.id,
        cardId: card.id,
        controllerId: player.id,
        costItems: costItems,
        effectItems: effectItems,
      })
    }
  }

  // handle attack action
  if (
    card.type === CardType.CREATURE &&
    card.location === CardLocation.BATTLEFIELD &&
    game.phase === Phase.ATTACKERS &&
    player.id === game.hasTurn
  ) {
    const attackCostItem: ICostItem = {
      type: CostItemType.TAP,
      controllerId: player.id,
      arguments: {
        cardId: card.id,
      },
    }
    const attackEffectItem: IEffectItem = {
      type: EffectItemType.DECLARE_ATTACK,
      executionType: ExecutionType.IMMEDIATE,
      arguments: {
        attackingCardId: card.id,
        defendingPlayerId: opponent.id,
      },
    }

    if (validateCostItem(game, attackCostItem)) {
      actions.push({
        type: ActionType.ATTACK_ACTION,
        cardId: card.id,
        controllerId: player.id,
        costItems: [attackCostItem],
        effectItems: [attackEffectItem],
      })
    }
  }

  // handle block action
  if (
    card.type === CardType.CREATURE &&
    card.location === CardLocation.BATTLEFIELD &&
    card.tapped === false &&
    game.phase === Phase.BLOCKERS &&
    player.id !== game.hasTurn
  ) {
    const activeAttackCards = game.players
      .map((player) => player.cards)
      .flat()
      .filter((card) => card.activeAttack !== null)

    for (const activeAttackCard of activeAttackCards) {
      const blockEffectItem: IEffectItem = {
        type: EffectItemType.DECLARE_BLOCK,
        executionType: ExecutionType.IMMEDIATE,
        arguments: {
          blockingCardId: card.id,
          attackingCardId: activeAttackCard.id,
        },
      }

      actions.push({
        type: ActionType.BLOCK_ACTION,
        cardId: card.id,
        controllerId: player.id,
        costItems: [],
        effectItems: [blockEffectItem],
      })
    }
  }

  return actions
}
