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
  Target,
  CostType,
  ExecutionType,
  AbilitySpeed,
  IEffectTemplate,
  EffectItemType,
} from '../types'

import type { ICardData } from './getCardData'

const defaultCard = {
  // dynamic card data
  location: CardLocation.LIBRARY,
  tapped: false,
  actions: [],
  activeAttack: null,
  activeBlock: null,
}

export function generateCard(cardData: ICardData): ICard {
  let card: ICard

  switch (cardData.type) {
    case 'CREATURE':
      if (!cardData.attack || !cardData.defense) {
        throw new Error('creature card missing stats')
      }
      card = {
        ...defaultCard,
        id: uuidv4(),
        name: cardData.name,
        level: cardData.level,
        type: CardType.CREATURE,
        cost: Number(cardData.cost),

        attack: Number(cardData.attack),
        defense: Number(cardData.defense),
        abilities: [],
      }
      break
    case 'ARTIFACT':
      card = {
        ...defaultCard,
        id: uuidv4(),
        name: cardData.name,
        level: cardData.level,
        type: CardType.ARTIFACT,
        cost: Number(cardData.cost),

        abilities: [],
      }
      break
    case 'ENCHANTMENT':
      card = {
        ...defaultCard,
        id: uuidv4(),
        name: cardData.name,
        level: cardData.level,
        type: CardType.ENCHANTMENT,
        cost: Number(cardData.cost),

        abilities: [],
      }
      break
    case 'SPELL':
      card = {
        ...defaultCard,
        id: uuidv4(),
        name: cardData.name,
        level: cardData.level,
        type: CardType.SPELL,
        cost: Number(cardData.cost),

        effectTemplates: [],
      }
      break
    default:
      throw new Error('card type not matched')
  }

  if (card.type === CardType.SPELL) {
    if (cardData.effect_1 && cardData.effect_1_args) {
      const effectTemplate = getEffectTemplate(cardData.effect_1)
      const prepopulatedArguments = JSON.parse(cardData.effect_1_args)
      card.effectTemplates.push({
        ...effectTemplate,
        arguments: { ...effectTemplate.arguments, ...prepopulatedArguments },
      })
    }
    if (cardData.effect_2 && cardData.effect_2_args) {
      const effectTemplate = getEffectTemplate(cardData.effect_2)
      const prepopulatedArguments = JSON.parse(cardData.effect_2_args)
      card.effectTemplates.push({
        ...effectTemplate,
        arguments: { ...effectTemplate.arguments, ...prepopulatedArguments },
      })
    }
  } else {
    // if (cardData.ability_1) {
    //   const ability1 = getAbility(cardData.ability_1)
    //   card.abilities.push(ability1)
    // }
    // if (cardData.ability_2) {
    //   const ability2 = getAbility(cardData.ability_2)
    //   card.abilities.push(ability2)
    // }
  }

  return card
}

// function getAbility(abilityId: string): IAbility {
//   const foundAbility = abilities.find((ability) => ability.id === abilityId)
//   if (!foundAbility) {
//     throw new Error(`abilityId not found: ${abilityId}`)
//   }

//   const result: IAbility = {
//     id: foundAbility.id,
//     name: foundAbility.name,
//     description: foundAbility.description,
//     speed: foundAbility.speed as AbilitySpeed,
//     costs: [],
//     effects: [],
//   }

//   const costKeys = ['cost1', 'cost2', 'cost3']
//   costKeys.forEach((costIdx) => {
//     const costId = foundAbility[costIdx as 'cost1']

//     if (costId !== '') {
//       result.costs.push(getCost(costId))
//     }
//   })

//   const effectKeys = ['effect1', 'effect2', 'effect3']
//   effectKeys.forEach((effectIdx) => {
//     const effectId = foundAbility[effectIdx as 'cost1']

//     if (effectId !== '') {
//       result.effects.push(getEffect(effectId))
//     }
//   })

//   return result
// }

// function getCost(costId: string): ICost {
//   const foundCost = costs.find((cost) => cost.id === costId)
//   if (!foundCost) {
//     throw new Error(`costId not found: ${costId}`)
//   }

//   return {
//     type: (<any>CostType)[foundCost.type],
//     target: (<any>Target)[foundCost.target],
//     amount: Number(foundCost.amount),
//   }
// }

function getEffectTemplate(effectId: string): IEffectTemplate {
  const foundEffect = effects.find((effect) => effect.id === effectId)
  if (!foundEffect) {
    throw new Error(`effectId not found: ${effectId}`)
  }

  const defaultArguments = JSON.parse(foundEffect.arguments)

  return {
    type: (<any>EffectItemType)[foundEffect.type],
    executionType: ExecutionType.RESPONDABLE,
    arguments: defaultArguments,
  }
}
