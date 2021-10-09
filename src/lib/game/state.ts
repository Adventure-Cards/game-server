import { IGameMetadata, IGame, ICard, IAction, IStackItem, CardLocation, Phase } from './types'

export function getGameStateForPlayer(game: IGame, address: string): IGameStateForPlayer {
  const player = game.players.find((player) => player.address === address)
  if (!player) {
    throw new Error(`unable to find player`)
  }

  console.log('got player with cards', player.cards)

  const opponent = game.players.find((player) => player.address !== address)
  if (!opponent) {
    throw new Error(`unable to find opponent`)
  }

  console.log('got opponent with cards', opponent.cards)

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
      numberOfCardsInHand: opponent.cards.filter(
        (card) => card.location === CardLocation.BATTLEFIELD
      ).length,
      numberOfCardsInLibrary: opponent.cards.filter(
        (card) => card.location === CardLocation.LIBRARY
      ).length,
      battlefield: opponent.cards.filter((card) => card.location === CardLocation.BATTLEFIELD),
      graveyard: opponent.cards.filter((card) => card.location === CardLocation.GRAVEYARD),
      stack: opponent.cards.filter((card) => card.location === CardLocation.STACK),
    },
    metadata: game.metadata,
    turn: game.turn,
    phase: game.phase,
    hasPriority: game.hasPriority,
    hasTurn: game.hasTurn,
    stack: game.stack,
  }
}

interface IGameStateForPlayer {
  player: IPlayerForPlayer
  opponent: IOpponentForPlayer

  metadata: IGameMetadata
  turn: number
  phase: Phase
  hasPriority: string
  hasTurn: string
  stack: IStackItem[]
}

export interface IPlayerForPlayer {
  id: string
  address: string
  life: number
  mana: number
  hand: ICard[]
  numberOfCardsInLibrary: number
  battlefield: ICard[]
  graveyard: ICard[]
  stack: ICard[]
  actions: IAction[]
}

export interface IOpponentForPlayer {
  id: string
  address: string
  life: number
  mana: number
  numberOfCardsInHand: number
  numberOfCardsInLibrary: number
  battlefield: ICard[]
  graveyard: ICard[]
  stack: ICard[]
}
