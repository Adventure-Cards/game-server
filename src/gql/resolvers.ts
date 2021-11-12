import type { Resolvers } from './__generated__/gql-codegen'

import { getDeck, getDecksByAddress } from './thegraph'

import { Deck } from './__generated__/gql-codegen'

export const resolvers: Resolvers = {
  Query: {
    deck: async (_, { mintId }) => {
      const deck = await getDeck(mintId)
      if (!deck) {
        throw new Error(`Unable to find Deck`)
      }

      const _deck: Deck = { ...deck, mintId: deck.numericId }

      return _deck
    },
    decksByAddress: async (_, { address }) => {
      const decks = await getDecksByAddress(address)

      const _decks: Deck[] = decks.map((deck) => ({ ...deck, mintId: deck.numericId }))

      return _decks
    },
  },
}
