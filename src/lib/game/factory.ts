import { v4 as uuidv4 } from 'uuid'

import { IGameMetadata, IGame, Phase, IPlayer, CardLocation } from './types'

import { updateAvailableActionsForPlayers } from './actions'
import { shuffle, randomIntFromInterval } from './utils'
import { getDeck } from './decks'

export async function createGame(metadata: IGameMetadata): Promise<IGame> {
  // get and populate decks

  const players = await Promise.all(
    metadata.players.map(async (playerMetadata) => {
      const { address, deckId } = playerMetadata

      console.log('processing data for player:', { address, deckId })

      if (!deckId) {
        throw new Error(`no deckId for player with address: ${address}`)
      }

      const deck = await getDeck(deckId)
      if (!deck) {
        throw new Error(`couldn't find deck for deckId: ${deckId}`)
      }

      console.log('got deck with id:', deck.id)

      const cards = [...deck.cards]
      shuffle(cards)

      // put 3 cards into hand at random
      while (cards.filter((card) => card.location === CardLocation.HAND).length < 3) {
        cards[randomIntFromInterval(0, 44)].location = CardLocation.HAND
      }

      const player: IPlayer = {
        id: uuidv4(),
        address: address,
        life: 20,
        mana: 1,
        cards: deck.cards,

        availableActions: [],
      }

      return player
    })
  )

  let game: IGame = {
    metadata: metadata,
    players: players,
    hasPriority: players[0].id,
    hasTurn: players[0].id,
    phase: Phase.MAIN,
    stack: [],
    turn: 1,
  }

  game = updateAvailableActionsForPlayers(game)

  return game
}
