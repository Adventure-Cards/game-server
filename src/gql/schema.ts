import { gql } from 'apollo-server-express'

export const schema = gql`
  type Query {
    deck(mintId: Int!): Deck
  }

  type Deck {
    mintId: Int!
    owner: String!
    cards: [Card!]!
  }

  type Card {
    name: String!
    level: Int!
    type: String!
  }
`
