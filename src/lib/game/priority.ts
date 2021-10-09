/*

Terminology:
  "active player" -> player whose turn it is
  "inactive player" -> player whose turn it isn't

The Phases of a Turn
  Phase: DRAW
    No player has priority
    The following effects are executed immediately for the active player:
      Untap all permanents
      Add 1 mana to mana pool (up to ~8)
      Replenish all mana
      Draw a card
    Then the phase ends

  Phase: MAIN
    Priority is given to the active player
    The active player may submit the following actions:
      CAST actions for all card types
      ABILITY actions for abilities with speed "NORMAL"
      PASS_PRIORITY action

    When the active player submits an action, priority is passed to the inactive player
    The inactive player may submit the following actions:
      CAST actions for spells
      ABILITY actions for abilities with speed "FAST"
      PASS_PRIORITY action

    When both players submit the PASS_PRIORITY action in succession the phase ends immediately

  Phase: ATTACKERS
    Priority is given to the active player
    The active player is only able to submit the DECLARE_ATTACKS action
      attacks {
        attackingCardId: string,
        defendingPlayerId: string
      }[]
    When the active player submits DECLARE_ATTACKS, the phase ends

  Phase: BLOCKERS
    Priority is given to the inactive player
    The inactive player is only able to submit the DECLARE_BLOCKS action
      blocks {
        blockingCardId: string
        attackingCardId: string,
      }[]
    When the inactive player submits DECLARE_BLOCKS, the phase ends

  Phase: BATTLE
    Priority is given to the active player
    The active player may submit the following actions:
      CAST actions for spells
      ABILITY actions for abilities with speed "FAST"
      PASS_PRIORITY action

    When the active player submits an action, priority is passed to the inactive player

    The inactive player may submit the following actions:
      CAST actions for spells
      ABILITY actions for abilities with speed "FAST"
      PASS_PRIORITY action

    When both players submit the PASS_PRIORITY action in succession,
      the phase ends immediately and COMBAT_DAMAGE effects are processed

  Phase: END
    No player has priority
    The following effects are executed immediately for the active player:
      Enchantment triggered effects
*/
