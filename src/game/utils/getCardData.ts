import artifacts0 from '../../../data/artifacts.json'
import creatures from '../../../data/creatures.json'
import enchantments from '../../../data/enchantments.json'
import spells from '../../../data/spells.json'
import locations from '../../../data/locations.json'

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
