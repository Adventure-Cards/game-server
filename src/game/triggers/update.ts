import {
  IGame,
  ITrigger,
  IPlayer,
  ICard,
  IAction,
  ActionType,
  EffectType,
  Target,
  ICostItem,
  IEffectItem,
  EffectExecutionType,
  AbilitySpeed,
  Phase,
  CardType,
  CostType,
  EffectItemType,
  CardLocation,
} from '../types'

/*
the purpose of this file is to update the list of triggers that are registered on the game state


*/

export function updateTriggers(initialGame: IGame): IGame {
  const game = { ...initialGame }

  const triggers: ITrigger[] = []

  // battle trigger
  // triggered when the PHASE_BATTLE effect fires
  // for each attacking creature (creature that has a non-null attack field)
  //   find if that attack has any corresponding blocks
  //     if unblocked, create a COMBAT_DAMAGE effectItem based purely on the attack field
  //     if blocked, create COMBAT_DAMAGE effectItems for each blocker, using data on the attack field

  const battleTrigger = {
    on: EffectType.PHASE_BATTLE,
    effectItems: [],
  }

  return game
}
