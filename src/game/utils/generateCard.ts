import { v4 as uuidv4 } from 'uuid'

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
} from '../types'

import type { ICardData } from './getCardData'

export function generateCard(cardData: ICardData): ICard {
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
        activeAttack: null,
        activeBlock: null,
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
        activeAttack: null,
        activeBlock: null,
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
        activeAttack: null,
        activeBlock: null,
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
        activeAttack: null,
        activeBlock: null,
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
  }
}
