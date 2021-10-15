## Adventure Cards - Offchain Game Engine

### Turns, Phases, and the Core Rules

This section describes the phases of a turn, and in doing so also describes the core rules of the game.

A quick note about "priority": Passing priority is just like tapping the chess timer to indicate that you've taken your turn. But unlike chess, Adventure Cards allows priority to be passed between players several times during each turn. This gives each player the chance to cast spells and take actions during their opponents turn. Every time the game state gets updated, the game engine executes logic to determine who gets priority next.

#### Phase 1: DRAW

    The PHASE_DRAW effect is processed

    No player has priority
    The following effects are executed for the active player:
        Untap all permanents
        Add 1 mana to mana pool (up to ~8)
        Replenish all mana
        Draw a card
    The phase ends

#### Phase 2: MAIN

    The PHASE_MAIN effect is processed

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

    When both players submit the PASS_PRIORITY action in succession the phase ends

#### Phase 3: ATTACKERS

    The PHASE_ATTACKERS effect is processed

    Priority is given to the active player
    The active player is only able to submit DECLARE_ATTACK actions
    When the active player submits PASS_PRIORITY, the phase ends

#### Phase 4: BLOCKERS

    The PHASE_BLOCKERS effect is processed

    Priority is given to the inactive player
    The inactive player is only able to submit DECLARE_BLOCK actions
    When the inactive player submits PASS_PRIORITY, the phase ends

#### Phase 5: BATTLE

    The PHASE_BATTLE effect is processed

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
        COMBAT_DAMAGE effects are created and processed, and the phase ends

#### Phase 6: END

    The PHASE_END effect is processed

    No player has priority
    The phase ends

### Game Engine Explained

The game engine is built on a small number of core concepts. If you've made it this far, you've already covered the trickiest one (priority).

1. Priority
2. Costs and Effects
3. Actions and Triggers
4. Handlers
5. (bonus) The Stack

### Costs & Effects

Costs and Effects are the core data structures of the game. When processed, both Costs and Effects update the game state. In fact, Costs and Effects are the _only_ way that the game state gets updated.

Here are a few sample Costs. Only the name and type fields are required for all Costs - the remaining fields are specific to the type field.

Pay (1).

- name: mana-1
- type: MANA
- amount: 1
- arguments: [ ]

Tap a permanent.

- name: tap
- type: TAP
- arguments: [ cardId ]

Sacrifice 1 permanent.

- name: sacrifice-permanent-1
- type: SACRIFICE
- target: PERMANENT
- number: 1
- arguments: [ cardId ]

Here are a few sample Effects. Only the name and type fields are required for all Costs - the remaining fields are specific to the type field.

Deal 3 damage to target player.

- name: damage-player-3
- type: DAMAGE
- target: PLAYER
- amount: 3
- arguments: [ playerId ]

Return target permanent to its owners hand.

- name: return-permanent-to-hand
- type: RETURN_TO_HAND_OWNER
- target: PERMANENT
- arguments: [ cardId ]

Deal X damage to target creature.

- name: damage-creature-x
- type: DAMAGE
- target: CREATURE
- arguments: [ cardId, amount ]

Effects also have another special field: ExecutionType, which is either

### CostItems and EffectItems

Costs and Effects are _static data_ - templates to be implemented. Before they are ready to be sent to the game engine, they must be packaged up into CostItems and EffectItems. In programming terms, you can think of a Cost as a class, and a CostItem as an instance of that class. In most cases, a CostItem/EffectItem will also include a number of arguments that are required to actually process that Cost/Effect.

As an example, consider the "tap" Cost above. How does the game engine know which card to tap while processing that Cost? Well, the CostItem for the "tap" Cost requires an argument: "cardId".

### Actions & Triggers

Actions and Triggers are how CostItems and EffectItems get created and sent to the game engine for processing. Actions can have CostItems and EffectItems, while Triggers only have EffectItems.

Actions are transient, and are initiated by users. Here's an example:

Tap this creature, pay 5 life: Return target creature to its owners hand.

- costItems: [tap(cardId), pay-life-1()]
- effectItems: [ return-creature-to-hand(cardId) ]

Triggers are persistent, and are initiated by the game engine. Here's an example:

You gain 1 life at the beginning of each end phase.

- on: [ PHASE_END ] <- this is a list of EffectType keys
- effectItems: [ gain-life-1() ]

Some triggers are not associated with a specific card, but are registered by the game engine itself. In fact, most of the core rules of the game are structured this way.

- on: [ PHASE_START ]
- effectItems [ active_player_untaps_permanents(), active_player_draws_card() ]

### Handlers

For every type of Cost and Effect, the game engine must implement a handler. These handlers are the _only_ place where the game state actually gets updated.

### Abilities

"Ability" refers to a specific type of Action/Trigger that is associated with a permanent. Abilities are only available to the player when that permanent is on the battlefield. There are both ActionAbilities and TriggerAbilities - these serve as a light wrapper around Action and Trigger.

### Terminology

- active player -> player whose turn it is
- inactive player -> player whose turn it isn't
- priority -> the ability to take the next game action
- permanent -> card that is placed onto the battlefield when played
- spell -> card that is played onto the graveyard when played
- mana -> the resource used to play cards
