import {
  IGame,
  Phase,
  IEffectItem,
  EffectType,
  IEffect,
  IPlayer,
  EffectItemType,
  CardLocation,
  CardType,
} from './types'

import { updateAvailableActionsForPlayers } from './actions'
import { drawCard } from './utils'

export function processEffectItem(initialGame: IGame, effectItem: IEffectItem): IGame {
  let game = { ...initialGame }

  const player = game.players.find((player) => player.id === effectItem.controllerId)
  if (!player) {
    throw new Error(`player with id ${effectItem.controllerId} not found`)
  }

  switch (effectItem.type) {
    case EffectItemType.CORE:
      game = processEffectCore(game, effectItem.effect, player)
      break
    case EffectItemType.CAST:
      game = processEffectCast(game, effectItem.effect, effectItem.cardId)
      break
    case EffectItemType.WITH_AMOUNT:
      game = processEffectWithAmount(game, effectItem.effect, effectItem.amount)
      break
    default:
      throw new Error(`unhandled EffectItemType: ${effectItem.type}`)
  }

  // after processing an effect, need to refresh the available actions
  // for each player, because the game state has changed
  game = updateAvailableActionsForPlayers(game)

  return game
}

function processEffectCore(initialGame: IGame, effect: IEffect, player: IPlayer): IGame {
  let game = { ...initialGame }

  switch (effect.type) {
    case EffectType.RELEASE_PRIORITY: {
      // first get the active and inactive players
      const activePlayer = game.players.find((player) => player.id === game.hasTurn)
      const inactivePlayer = game.players.find((player) => player.id !== game.hasTurn)
      if (!activePlayer || !inactivePlayer) {
        throw new Error(`unable to find active/inactive players`)
      }

      // if this RELEASE_PRIORITY action was submitted by the active player,
      // pass priority to the inactive player
      if (player.id === activePlayer.id) {
        game.hasPriority = inactivePlayer.id
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
      throw new Error(`unhandled EffectType: ${effect.type}`)
  }

  return game
}

function processEffectWithAmount(initialGame: IGame, effect: IEffect, amount: number): IGame {
  const game = { ...initialGame }

  switch (effect.type) {
    case EffectType.DAMAGE_ANY:
      game.players = game.players.map((player) =>
        player.address === 'opponent' ? { ...player, life: player.life - amount } : { ...player }
      )
      break
    case EffectType.DAMAGE_PLAYER:
      game.players = game.players.map((player) =>
        player.address === 'opponent' ? { ...player, life: player.life - amount } : { ...player }
      )
      break
    default:
      throw new Error(`unhandled EffectType: ${effect.type}`)
  }

  return game
}

function processEffectCast(initialGame: IGame, effect: IEffect, cardId: string): IGame {
  let game = { ...initialGame }

  const card = game.players
    .map((player) => player.cards)
    .flat()
    .find((card) => card.id === cardId)

  if (!card) {
    throw new Error(`no card found with id ${cardId} while handling Cast`)
  }

  switch (effect.type) {
    case EffectType.CAST:
      if (card.type === CardType.SPELL) {
        card.location = CardLocation.GRAVEYARD
        // how do we kick off spell effects?
        card.effects.forEach((effect) => {
          game = processEffectWithAmount(game, effect, 1)
        })
      } else {
        card.location = CardLocation.BATTLEFIELD
      }
      break
    default:
      throw new Error(`unhandled EffectType: ${effect.type}`)
  }

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
    game.phase = Phase.COMBAT
    // Process COMBAT phase effects here:

    // give priority to the active player for start of combat phase
    game.hasPriority = activePlayer.id
  } else if (game.phase === Phase.COMBAT) {
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
