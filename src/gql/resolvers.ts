import type { Resolvers } from './__generated__/gql-codegen'

import { getDeck } from '../../src/game/utils/getDeck'

import { Deck } from './__generated__/gql-codegen'

export const resolvers: Resolvers = {
  Query: {
    deck: async (_, { mintId }) => {
      const _deck = await getDeck(mintId)
      if (!_deck) {
        throw new Error(`Unable to find Deck`)
      }

      const __deck: Deck = { ..._deck, mintId: _deck.numericId }

      return __deck
    },
  },
}
