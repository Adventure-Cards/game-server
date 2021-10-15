import { request, gql } from 'graphql-request'

import { ICardData, getCardData } from './getCardData'

export interface IDeck {
  id: number
  numericId: number
  owner: string
  name: string
  cards: ICardData[]
}

const SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/knav-eth/adventure-cards'

const GET_DECK_BY_ID_QUERY = gql`
  query GetCardsByDeck($deckId: Int) {
    adventureCardPacks(where: { numericId: $deckId }) {
      id
      numericId
      owner
      name
      cards
    }
  }
`

export async function getDeck(deckId: number): Promise<IDeck | null> {
  try {
    const response = await request(SUBGRAPH, GET_DECK_BY_ID_QUERY, { deckId: deckId })
    return {
      ...response.adventureCardPacks[0],
      cards: response.adventureCardPacks[0].cards.map((card: string) => getCardData(card)),
    }
  } catch (err) {
    console.warn(`could not fetch data for deckId: ${deckId}`)
    return null
  }
}
