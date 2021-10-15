import {
  IGame,
  IPlayer,
  Phase,
  IEffectItem,
  EffectType,
  EffectItemType,
  CardLocation,
  CardType,
  IEffectItemCast,
  IEffectItemDeclareAttack,
  IEffectItemCore,
} from './types'

import { updateActions } from './actions/update'
import { drawCard } from './utils/helpers'

export function validateEffectItem(game: IGame, effectItem: IEffectItem): boolean {
  return true
}

export function processEffectItem(initialGame: IGame, effectItem: IEffectItem): IGame {
  let game = { ...initialGame }

  const player = game.players.find((player) => player.id === effectItem.controllerId)
  if (!player) {
    throw new Error(`player with id ${effectItem.controllerId} not found`)
  }

  switch (effectItem.type) {
    case EffectItemType.CORE:
      game = processEffectCore(game, player, effectItem)
      break
    case EffectItemType.CAST:
      game = processEffectItemCast(game, player, effectItem)
      break
    case EffectItemType.DECLARE_ATTACK:
      game = processEffectItemDeclareAttack(game, player, effectItem)
      break
    default:
      throw new Error(`unhandled EffectItemType: ${effectItem.type}`)
  }

  // after processing an effect, need to refresh the available actions
  // for each player, because the game state has changed
  game = updateActions(game)

  return game
}

function processEffectCore(
  initialGame: IGame,
  player: IPlayer,
  effectItem: IEffectItemCore
): IGame {
  let game = { ...initialGame }

  switch (effectItem.effect.type) {
    case EffectType.RELEASE_PRIORITY: {
      // first get the active and inactive players
      const activePlayer = game.players.find((player) => player.id === game.hasTurn)
      const inactivePlayer = game.players.find((player) => player.id !== game.hasTurn)
      if (!activePlayer || !inactivePlayer) {
        throw new Error(`unable to find active/inactive players`)
      }

      // if this RELEASE_PRIORITY action was submitted by the active player,
      //   if we're in the MAIN or BATTLE phases
      //     pass priority to the inactive player
      //   if we're in any other phase
      //     advance the phase
      if (player.id === activePlayer.id) {
        if (game.phase === Phase.MAIN || game.phase === Phase.BATTLE) {
          game.hasPriority = inactivePlayer.id
        } else {
          game = advancePhase(game)
        }
        break
      }

      // if this RELEASE_PRIORITY action was submitted by the inactive player,
      //   if there's something on the stack,
      //     process an item from the stack and pass priority back to active player
      //   if there's nothing on the stack,
      //     advance the phase
      if (player.id === inactivePlayer.id) {
        const stackItem = game.stack.pop()
        if (stackItem) {
          game = processEffectItem(game, stackItem.effectItem)
          game.hasPriority = activePlayer.id
        } else {
          game = advancePhase(game)
        }
        break
      }

      throw new Error(`not able to assign RELEASE_PRIORITY action to any player`)
    }
    default:
      throw new Error(`unhandled EffectType: ${effectItem.effect.type}`)
  }

  return game
}

function processEffectItemCast(
  initialGame: IGame,
  player: IPlayer,
  effectItem: IEffectItemCast
): IGame {
  const game = { ...initialGame }

  const card = game.players
    .map((player) => player.cards)
    .flat()
    .find((card) => card.id === effectItem.cardId)

  if (!card) {
    throw new Error(`no card found with id ${effectItem.cardId} while handling Cast`)
  }

  switch (effectItem.effect.type) {
    case EffectType.CAST:
      if (card.type === CardType.SPELL) {
        card.location = CardLocation.GRAVEYARD
        // how do we kick off spell effects?
        card.effects.forEach((effect) => {
          // game = processEffectWithAmount(game, effect, 1)
        })
      } else {
        card.location = CardLocation.BATTLEFIELD
      }
      break
    default:
      throw new Error(`unhandled EffectType: ${effectItem.effect.type}`)
  }

  return game
}

function processEffectItemDeclareAttack(
  initialGame: IGame,
  player: IPlayer,
  effectItem: IEffectItemDeclareAttack
): IGame {
  const game = { ...initialGame }

  console.log('processing EffectItemDeclareAttack')

  const card = game.players
    .map((player) => player.cards)
    .flat()
    .find((card) => card.id === effectItem.cardId)

  if (!card) {
    throw new Error(`no card found with id ${effectItem.cardId} while handling DeclareAttack`)
  }

  switch (effectItem.effect.type) {
    case EffectType.DECLARE_ATTACK:
      console.log('set card.attacking to true')
      card.attacking = true
      break
    default:
      throw new Error(`unhandled EffectType: ${effectItem.effect.type}`)
  }

  const foundCardAgain = game.players
    .map((player) => player.cards)
    .flat()
    .find((card) => card.id === effectItem.cardId)
  console.log('foundCardAgain: ', foundCardAgain)

  return game
}

function advancePhase(initialGame: IGame): IGame {
  let game = { ...initialGame }

  const activePlayer = game.players.find((player) => player.id === game.hasTurn)
  const inactivePlayer = game.players.find((player) => player.id !== game.hasTurn)
  if (!activePlayer || !inactivePlayer) {
    throw new Error(`unable to find active/inactive players`)
  }

  // eventually, we might want this function to kick off other effects
  // instead of making these game state updates inline

  if (game.phase === Phase.START) {
    game.phase = Phase.MAIN
    // process MAIN phase effects here:

    // give priority to the active player for start of combat phase
    game.hasPriority = activePlayer.id
  } else if (game.phase === Phase.MAIN) {
    game.phase = Phase.ATTACKERS
    // Process ATTACKERS phase effects here:

    // give priority to the active player to declare attackers
    game.hasPriority = activePlayer.id
  } else if (game.phase === Phase.ATTACKERS) {
    game.phase = Phase.BLOCKERS
    // Process BLOCKERS phase effects here:

    // give priority to the active player to declare attackers
    game.hasPriority = inactivePlayer.id
  } else if (game.phase === Phase.BLOCKERS) {
    game.phase = Phase.BATTLE
    // Process BATTLE phase effects here:

    // give priority to the active player to cast combat spells
    game.hasPriority = activePlayer.id
  } else if (game.phase === Phase.BATTLE) {
    game.phase = Phase.END
    // Process END phase effects here:

    // TODO enchantment triggered abilities
    // immediately advance the phase without giving anyone priority
    game = advancePhase(game)
  } else if (game.phase === Phase.END) {
    game.phase = Phase.START
    // Process START phase effects here

    game.turn += 1
    game.hasTurn = inactivePlayer.id
    game.hasPriority = inactivePlayer.id

    // untap permanents
    inactivePlayer.cards.forEach((card) => {
      if (card.location === CardLocation.BATTLEFIELD) {
        card.tapped = false
      }
    })

    // draw a card
    game = drawCard(game, inactivePlayer.id)

    // reset mana to current turn count
    inactivePlayer.mana = game.turn

    // immediately advance the phase without giving anyone priority
    game = advancePhase(game)
  }

  return game
}
