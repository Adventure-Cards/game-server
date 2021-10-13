import { v4 as uuidv4 } from 'uuid'
import { request, gql } from 'graphql-request'

import artifacts0 from '../../../data/artifacts.json'
import creatures from '../../../data/creatures.json'
import enchantments from '../../../data/enchantments.json'
import spells from '../../../data/spells.json'
import locations from '../../../data/locations.json'
import abilities from '../../../data/abilities.json'
import effects from '../../../data/effects.json'
import costs from '../../../data/costs.json'

import {
  ICard,
  CardType,
  CardLocation,
  ICost,
  IAbility,
  EffectType,
  Target,
  CostType,
  EffectExecutionType,
  AbilitySpeed,
  IEffect,
} from './types'

export interface IDeck {
  id: number
  numericId: number
  owner: string
  name: string
  cards: ICard[]
}

export interface ICardData {
  level: number
  name: string
  type: string
  cost?: string | undefined
  rarity?: string | undefined
  color?: string | undefined
  attack?: string | undefined
  defense?: string | undefined
  ability_1?: string | undefined
  ability_2?: string | undefined
  effect1?: string | undefined
  effect2?: string | undefined
  effect3?: string | undefined
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
      cards: response.adventureCardPacks[0].cards
        .map((card: string) => getCardData(card))
        .map((card: ICardData) => getCard(card)),
    }
  } catch (err) {
    console.warn(`could not fetch data for deckId: ${deckId}`)
    return null
  }
}

export function getCardData(card: string): ICardData | null {
  // hack to handle two word artifact names
  card = card.replace('Divine Robe', 'DivineRobe')
  card = card.replace('Ghost Wand', 'GhostWand')
  const artifacts = artifacts0.map((artifact) => ({
    ...artifact,
    name: artifact.name.replace('Divine Robe', 'DivineRobe').replace('Ghost Wand', 'GhostWand'),
  }))

  const words = card.split(' ')

  let result = helper()
  if (!result) {
    return null
  }

  result = {
    ...result,
    name: result.name.replace('DivineRobe', 'Divine Robe').replace('GhostWand', 'Ghost Wand'),
  }

  return result

  function helper() {
    // handle commons
    if (words.length === 1) {
      const name = words[0]

      if (creatures.map((creature) => creature.name).includes(name)) {
        return {
          ...creatures.find((creature) => creature.name === name),
          level: 0,
          name: card,
          type: 'CREATURE',
        }
      } else if (artifacts.map((artifact) => artifact.name).includes(name)) {
        return {
          ...artifacts.find((artifact) => artifact.name === name),
          level: 0,
          name: card,
          type: 'ARTIFACT',
        }
      } else if (enchantments.map((enchantment) => enchantment.name).includes(name)) {
        return {
          ...enchantments.find((enchantment) => enchantment.name === name),
          level: 0,
          name: card,
          type: 'ENCHANTMENT',
        }
      } else if (spells.map((spell) => spell.name).includes(name)) {
        return {
          ...spells.find((spell) => spell.name === name),
          level: 0,
          name: card,
          type: 'SPELL',
        }
      }
    }

    // handle rare spells, enchantments, artifacts
    if (words.length === 2) {
      // first word will be a spell type, second word will be a spell, enchantment, or artifact name
      // const type = words[0]
      const name = words[1]

      if (creatures.map((creature) => creature.name).includes(name)) {
        return {
          ...creatures.find((creature) => creature.name === name),
          level: 1,
          name: card,
          type: 'CREATURE',
        }
      } else if (artifacts.map((artifact) => artifact.name).includes(name)) {
        return {
          ...artifacts.find((artifact) => artifact.name === name),
          level: 1,
          name: card,
          type: 'ARTIFACT',
        }
      } else if (enchantments.map((enchantment) => enchantment.name).includes(name)) {
        return {
          ...enchantments.find((enchantment) => enchantment.name === name),
          level: 1,
          name: card,
          type: 'ENCHANTMENT',
        }
      } else if (spells.map((spell) => spell.name).includes(name)) {
        return {
          ...spells.find((spell) => spell.name === name),
          level: 1,
          name: card,
          type: 'SPELL',
        }
      }
    }

    // from here on out, the name will always be the 3rd word
    const name = words[2]

    // handle rare creatures and legendary spells, enchantments, artifacts
    if (words.length === 3) {
      if (creatures.map((creature) => creature.name).includes(name)) {
        return {
          ...creatures.find((creature) => creature.name === name),
          level: 1,
          name: card,
          type: 'CREATURE',
        }
      } else if (artifacts.map((artifact) => artifact.name).includes(name)) {
        return {
          ...artifacts.find((artifact) => artifact.name === name),
          level: 2,
          name: card,
          type: 'ARTIFACT',
        }
      } else if (enchantments.map((enchantment) => enchantment.name).includes(name)) {
        return {
          ...enchantments.find((enchantment) => enchantment.name === name),
          level: 2,
          name: card,
          type: 'ENCHANTMENT',
        }
      } else if (spells.map((spell) => spell.name).includes(name)) {
        return {
          ...spells.find((spell) => spell.name === name),
          level: 2,
          name: card,
          type: 'SPELL',
        }
      }
    }

    const locationString = words.slice(3).join(' ')
    const location = locations.find((location) => location.location === locationString)
    if (!location) {
      throw new Error(`unhandled location: ${location}`)
    }

    // handle legendary creatures
    if (
      creatures
        .filter((creature) => creature.rarity === 'legendary')
        .map((creature) => creature.name)
        .includes(name)
    ) {
      return {
        ...creatures.find((creature) => creature.name === name),
        level: 2,
        name: card,
        specialEffect: location.effect,
        type: 'CREATURE',
      }
    }

    // handle mythic creatures
    if (
      creatures
        .filter((creature) => creature.rarity === 'mythic')
        .map((creature) => creature.name)
        .includes(name)
    ) {
      return {
        ...creatures.find((creature) => creature.name === name),
        level: 3,
        name: card,
        specialEffect: location.effect,
        type: 'CREATURE',
      }
    }

    return null
  }
}

function getCard(cardData: ICardData): ICard {
  let card: ICard

  // first get card cost
  const foundCost = costs.find((cost) => cost.id === cardData.cost)
  if (!foundCost) {
    throw new Error(`costId not found: ${cardData.cost}`)
  }
  const cost: ICost = {
    type: (<any>CostType)[foundCost.type],
    target: (<any>Target)[foundCost.target],
    amount: Number(foundCost.amount),
  }

  switch (cardData.type) {
    case 'CREATURE':
      if (!cardData.attack || !cardData.defense) {
        throw new Error('creature card missing stats')
      }
      card = {
        name: cardData.name,
        level: cardData.level,
        id: uuidv4(),
        type: (<any>CardType)[cardData.type],
        abilities: [],
        attack: Number(cardData.attack),
        defense: Number(cardData.defense),

        location: CardLocation.LIBRARY,
        tapped: false,
        attacking: false,
        cost: cost,
        actions: [],
      }
      break
    case 'ARTIFACT':
      card = {
        name: cardData.name,
        level: cardData.level,
        id: uuidv4(),
        type: (<any>CardType)[cardData.type],
        abilities: [],

        location: CardLocation.LIBRARY,
        tapped: false,
        attacking: false,
        cost: cost,
        actions: [],
      }
      break
    case 'ENCHANTMENT':
      card = {
        name: cardData.name,
        level: cardData.level,
        id: uuidv4(),
        type: (<any>CardType)[cardData.type],
        abilities: [],

        location: CardLocation.LIBRARY,
        tapped: false,
        attacking: false,
        cost: cost,
        actions: [],
      }
      break
    case 'SPELL':
      card = {
        name: cardData.name,
        level: cardData.level,
        id: uuidv4(),
        type: (<any>CardType)[cardData.type],
        effects: [],

        location: CardLocation.LIBRARY,
        tapped: false,
        attacking: false,
        cost: cost,
        actions: [],
      }
      break
    default:
      throw new Error('card type not matched')
  }

  if (card.type === CardType.SPELL) {
    if (cardData.effect1) {
      const effect1 = getEffect(cardData.effect1)
      card.effects.push(effect1)
    }
    if (cardData.effect2) {
      const effect1 = getEffect(cardData.effect2)
      card.effects.push(effect1)
    }
    if (cardData.effect3) {
      const effect1 = getEffect(cardData.effect3)
      card.effects.push(effect1)
    }
  } else {
    if (cardData.ability_1) {
      const ability1 = getAbility(cardData.ability_1)
      card.abilities.push(ability1)
    }
    if (cardData.ability_2) {
      const ability2 = getAbility(cardData.ability_2)
      card.abilities.push(ability2)
    }
  }

  return card
}

function getAbility(abilityId: string): IAbility {
  const foundAbility = abilities.find((ability) => ability.id === abilityId)
  if (!foundAbility) {
    throw new Error(`abilityId not found: ${abilityId}`)
  }

  const result: IAbility = {
    id: foundAbility.id,
    name: foundAbility.name,
    description: foundAbility.description,
    speed: foundAbility.speed as AbilitySpeed,
    costs: [],
    effects: [],
  }

  const costKeys = ['cost1', 'cost2', 'cost3']
  costKeys.forEach((costIdx) => {
    const costId = foundAbility[costIdx as 'cost1']

    if (costId !== '') {
      result.costs.push(getCost(costId))
    }
  })

  const effectKeys = ['effect1', 'effect2', 'effect3']
  effectKeys.forEach((effectIdx) => {
    const effectId = foundAbility[effectIdx as 'cost1']

    if (effectId !== '') {
      result.effects.push(getEffect(effectId))
    }
  })

  return result
}

function getCost(costId: string): ICost {
  const foundCost = costs.find((cost) => cost.id === costId)
  if (!foundCost) {
    throw new Error(`costId not found: ${costId}`)
  }

  return {
    type: (<any>CostType)[foundCost.type],
    target: (<any>Target)[foundCost.target],
    amount: Number(foundCost.amount),
  }
}

function getEffect(effectId: string): IEffect {
  const foundEffect = effects.find((effect) => effect.id === effectId)
  if (!foundEffect) {
    throw new Error(`effectId not found: ${effectId}`)
  }

  return {
    type: (<any>EffectType)[foundEffect.type],
    executionType: (<any>EffectExecutionType)[foundEffect.executionType],
    target: (<any>Target)[foundEffect.target],
    amount: Number(foundEffect.amount),
  }
}
