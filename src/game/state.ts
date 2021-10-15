import { IGame, CardLocation, IGameStateForPlayer, IGameStateForPlaytest } from './types'

export function getGameStateForPlayer(game: IGame, address: string): IGameStateForPlayer {
  const player = game.players.find((player) => player.address === address)
  if (!player) {
    throw new Error(`unable to find player`)
  }

  const opponent = game.players.find((player) => player.address !== address)
  if (!opponent) {
    throw new Error(`unable to find opponent`)
  }

  return {
    player: {
      id: player.id,
      address: player.address,
      life: player.life,
      mana: player.mana,
      hand: player.cards.filter((card) => card.location === CardLocation.HAND),
      numberOfCardsInLibrary: player.cards.filter((card) => card.location === CardLocation.LIBRARY)
        .length,
      battlefield: player.cards.filter((card) => card.location === CardLocation.BATTLEFIELD),
      graveyard: player.cards.filter((card) => card.location === CardLocation.GRAVEYARD),
      stack: player.cards.filter((card) => card.location === CardLocation.STACK),
      actions: player.availableActions,
    },
    opponent: {
      id: opponent.id,
      address: opponent.address,
      life: opponent.life,
      mana: opponent.mana,
      numberOfCardsInHand: opponent.cards.filter((card) => card.location === CardLocation.HAND)
        .length,
      numberOfCardsInLibrary: opponent.cards.filter(
        (card) => card.location === CardLocation.LIBRARY
      ).length,
      battlefield: opponent.cards.filter((card) => card.location === CardLocation.BATTLEFIELD),
      graveyard: opponent.cards.filter((card) => card.location === CardLocation.GRAVEYARD),
      stack: opponent.cards.filter((card) => card.location === CardLocation.STACK),
      actions: opponent.availableActions,
    },
    metadata: game.metadata,
    turn: game.turn,
    phase: game.phase,
    hasPriority: game.hasPriority,
    hasTurn: game.hasTurn,
    stack: game.stack,
  }
}

export function getGameStateForPlaytest(game: IGame): IGameStateForPlaytest {
  const player1 = game.players.find((player) => player.address === 'player1')
  if (!player1) {
    throw new Error(`unable to find player1`)
  }

  const player2 = game.players.find((player) => player.address === 'player2')
  if (!player2) {
    throw new Error(`unable to find player2`)
  }

  return {
    player1: {
      id: player1.id,
      address: player1.address,
      life: player1.life,
      mana: player1.mana,
      hand: player1.cards.filter((card) => card.location === CardLocation.HAND),
      numberOfCardsInLibrary: player1.cards.filter((card) => card.location === CardLocation.LIBRARY)
        .length,
      battlefield: player1.cards.filter((card) => card.location === CardLocation.BATTLEFIELD),
      graveyard: player1.cards.filter((card) => card.location === CardLocation.GRAVEYARD),
      stack: player1.cards.filter((card) => card.location === CardLocation.STACK),
      actions: player1.availableActions,
    },
    player2: {
      id: player2.id,
      address: player2.address,
      life: player2.life,
      mana: player2.mana,
      hand: player2.cards.filter((card) => card.location === CardLocation.HAND),
      numberOfCardsInLibrary: player2.cards.filter((card) => card.location === CardLocation.LIBRARY)
        .length,
      battlefield: player2.cards.filter((card) => card.location === CardLocation.BATTLEFIELD),
      graveyard: player2.cards.filter((card) => card.location === CardLocation.GRAVEYARD),
      stack: player2.cards.filter((card) => card.location === CardLocation.STACK),
      actions: player2.availableActions,
    },
    metadata: game.metadata,
    turn: game.turn,
    phase: game.phase,
    hasPriority: game.hasPriority,
    hasTurn: game.hasTurn,
    stack: game.stack,
  }
}
