import {
  IGame,
  IPlayer,
  ICard,
  IAction,
  ActionType,
  Target,
  ICostItem,
  IEffectItem,
  AbilitySpeed,
  Phase,
  CardType,
  CostType,
  EffectItemType,
  CardLocation,
  IEffectItemCast,
  IEffectItemDeclareAttack,
  EffectExecutionType,
  IEffectItemDeclareBlock,
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
      const passPriorityAction: IAction = {
        type: ActionType.PRIORITY_ACTION,
        controllerId: player.id,
        costItems: [],
        effectItems: [
          {
            type: EffectItemType.PASS_PRIORITY,
            executionType: EffectExecutionType.IMMEDIATE,
            controllerId: player.id,
          },
        ],
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
      target: Target.PLAYER,
      playerId: player.id,
      cost: card.cost,
    }
    const castEffectItem: IEffectItemCast = {
      type: EffectItemType.CAST,
      executionType: EffectExecutionType.RESPONDABLE,
      controllerId: player.id,
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

    const castEffectItem: IEffectItemCast = {
      type: EffectItemType.CAST,
      executionType: EffectExecutionType.RESPONDABLE,
      controllerId: player.id,
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

    const attackEffectItem: IEffectItemDeclareAttack = {
      type: EffectItemType.DECLARE_ATTACK,
      executionType: EffectExecutionType.IMMEDIATE,
      controllerId: player.id,
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
      const blockEffectItem: IEffectItemDeclareBlock = {
        type: EffectItemType.DECLARE_BLOCK,
        executionType: EffectExecutionType.IMMEDIATE,
        controllerId: player.id,
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
