## game-server-v0

An experimental game server for Adventure Cards

## Rules of Priority

Terminology:
active player -> player whose turn it is
inactive player -> player whose turn it isn't

### The phases of a turn (and priority rules)

#### Phase: DRAW

    No player has priority
    The following effects are executed immediately for the active player:
        Untap all permanents
        Add 1 mana to mana pool (up to ~8)
        Replenish all mana
        Draw a card
    Then the phase ends

#### Phase: MAIN

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

#### Phase: ATTACKERS

    Priority is given to the active player
    The active player is only able to submit DECLARE_ATTACK actions
    When the active player submits PASS_PRIORITY, the phase ends

#### Phase: BLOCKERS

    Priority is given to the inactive player
    The inactive player is only able to submit DECLARE_BLOCK actions
    When the inactive player submits PASS_PRIORITY, the phase ends

#### Phase: BATTLE

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
        COMBAT_DAMAGE effects are created and processed, and the phase ends immediately

#### Phase: END

    No player has priority
    The following effects are executed immediately for the active player:
        Enchantment triggered effects
