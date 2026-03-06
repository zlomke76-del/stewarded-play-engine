// lib/skills/skillDefinitions.ts

import type { SkillDefinition, SkillDefinitionMap } from "./SkillTypes";

export const SKILL_DEFINITIONS: SkillDefinitionMap = {
  // =========================================================
  // PLAYER — WARRIOR
  // =========================================================
  guard_break: {
    id: "guard_break",
    label: "Guard Break",
    actorKind: "player",
    category: "attack",
    phase: "combat",
    className: "Warrior",
    description: "A heavy committed strike that cracks a defended target open.",
    shortDescription: "Deal damage and expose the target.",
    targeting: {
      targetType: "single_enemy",
      range: "melee",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    hitRoll: { enabled: true, baseBonus: 1, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 4, damageType: "physical" },
      { type: "apply_condition", condition: "exposed", duration: "end_of_turn" },
      { type: "spawn_audit_note", note: "Target guard broken; defenses compromised." },
    ],
    effectsOnMiss: [{ type: "spawn_audit_note", note: "Guard Break missed." }],
    tags: { martial: true, playerOnly: true },
    aiHints: { openerPriority: 7 },
  },

  shield_wall: {
    id: "shield_wall",
    label: "Shield Wall",
    actorKind: "player",
    category: "defense",
    phase: "combat",
    className: "Warrior",
    description: "Brace and reinforce allied defense against incoming attacks.",
    shortDescription: "Grant AC and damage reduction to an ally.",
    targeting: {
      targetType: "single_ally",
      range: "near",
      requiresTarget: true,
      canTargetAllies: true,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "ac_bonus", amount: 2, duration: "rounds", rounds: 1 },
      { type: "reduce_incoming_damage", amount: 2, duration: "rounds", rounds: 1 },
      { type: "apply_condition", condition: "guarded", duration: "rounds", rounds: 1 },
    ],
    tags: { martial: true, playerOnly: true },
  },

  second_wind: {
    id: "second_wind",
    label: "Second Wind",
    actorKind: "player",
    category: "healing",
    phase: "combat",
    className: "Warrior",
    description: "Recover through grit and restore fighting strength.",
    shortDescription: "Heal self and gain brief protection.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "heal", amount: 6 },
      { type: "temp_hp", amount: 3 },
      { type: "spawn_audit_note", note: "Warrior rallied with Second Wind." },
    ],
    tags: { martial: true, playerOnly: true },
    aiHints: { preferredWhenSelfBelowHpPct: 45 },
  },

  // =========================================================
  // PLAYER — ROGUE
  // =========================================================
  backstab: {
    id: "backstab",
    label: "Backstab",
    actorKind: "player",
    category: "attack",
    phase: "combat",
    className: "Rogue",
    description: "Strike a distracted or exposed enemy for amplified damage.",
    shortDescription: "Deal bonus damage to exposed or unaware targets.",
    targeting: {
      targetType: "single_enemy",
      range: "melee",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    hitRoll: { enabled: true, baseBonus: 2, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 3, damageType: "piercing" },
      {
        type: "damage",
        amount: 4,
        damageType: "piercing",
        bonusIfCondition: "exposed",
      },
    ],
    tags: { martial: true, stealth: true, openerOnly: true, playerOnly: true },
    aiHints: { preferredWhenTargetHasCondition: "exposed", openerPriority: 9 },
  },

  shadowstep: {
    id: "shadowstep",
    label: "Shadowstep",
    actorKind: "player",
    category: "mobility",
    phase: "combat",
    className: "Rogue",
    description: "Slip through the battlefield and reposition without easy reprisal.",
    shortDescription: "Move freely and gain hidden.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "movement", amount: 2, ignoresEngagement: true },
      { type: "apply_condition", condition: "hidden", duration: "end_of_turn" },
      { type: "spawn_audit_note", note: "Rogue repositioned through Shadowstep." },
    ],
    tags: { stealth: true, shadow: true, playerOnly: true },
  },

  disarm_trap: {
    id: "disarm_trap",
    label: "Disarm Trap",
    actorKind: "player",
    category: "exploration",
    phase: "exploration",
    className: "Rogue",
    description: "Neutralize hazards before they trigger harm or pressure spikes.",
    shortDescription: "Reduce danger and lower pressure.",
    targeting: {
      targetType: "tile",
      range: "near",
      requiresTarget: true,
    },
    usage: { type: "at_will" },
    effectsOnUse: [
      { type: "pressure_shift", amount: -1 },
      { type: "mark_zone", note: "Trap neutralized." },
      { type: "spawn_audit_note", note: "Trap disarmed successfully." },
    ],
    tags: { stealth: true, utility: true as never, playerOnly: true },
  },

  // =========================================================
  // PLAYER — MAGE
  // =========================================================
  arc_bolt: {
    id: "arc_bolt",
    label: "Arc Bolt",
    actorKind: "player",
    category: "attack",
    phase: "combat",
    className: "Mage",
    description: "A focused arcane projectile that strikes at range.",
    shortDescription: "Reliable ranged arcane damage.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "at_will" },
    hitRoll: { enabled: true, baseBonus: 2, contestedBy: "ac" },
    effectsOnHit: [{ type: "damage", amount: 5, damageType: "arcane" }],
    tags: { magical: true, arcane: true, playerOnly: true },
  },

  frost_bind: {
    id: "frost_bind",
    label: "Frost Bind",
    actorKind: "player",
    category: "control",
    phase: "combat",
    className: "Mage",
    description: "Ice magic slows and roots a target in place.",
    shortDescription: "Damage and restrain target briefly.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    hitRoll: { enabled: true, baseBonus: 1, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 3, damageType: "cold" },
      { type: "apply_condition", condition: "rooted", duration: "rounds", rounds: 1 },
      { type: "apply_condition", condition: "chilled", duration: "rounds", rounds: 1 },
    ],
    tags: { magical: true, arcane: true, playerOnly: true },
  },

  detect_arcana: {
    id: "detect_arcana",
    label: "Detect Arcana",
    actorKind: "player",
    category: "exploration",
    phase: "exploration",
    className: "Mage",
    description: "Sense magical residue, hidden enchantments, and unstable pathways.",
    shortDescription: "Reveal tiles and magical clues.",
    targeting: {
      targetType: "zone",
      range: "zone",
      requiresTarget: false,
    },
    usage: { type: "at_will" },
    effectsOnUse: [
      { type: "reveal_tiles", amount: 3 },
      { type: "mark_zone", note: "Arcane traces revealed." },
      { type: "spawn_audit_note", note: "Mage detected magical resonance." },
    ],
    tags: { magical: true, arcane: true, playerOnly: true },
  },

  // =========================================================
  // PLAYER — CLERIC
  // =========================================================
  heal: {
    id: "heal",
    label: "Heal",
    actorKind: "player",
    category: "healing",
    phase: "combat",
    className: "Cleric",
    description: "Restore an ally's vitality through sacred power.",
    shortDescription: "Heal one ally.",
    targeting: {
      targetType: "single_ally",
      range: "near",
      requiresTarget: true,
      canTargetAllies: true,
      canTargetSelf: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    effectsOnUse: [
      { type: "heal", amount: 7 },
      { type: "remove_condition", condition: "bleeding" },
    ],
    tags: { magical: true, holy: true, playerOnly: true },
  },

  bless: {
    id: "bless",
    label: "Bless",
    actorKind: "player",
    category: "support",
    phase: "combat",
    className: "Cleric",
    description: "A sacred blessing steadies the ally's hand and spirit.",
    shortDescription: "Grant hit bonus and blessed condition.",
    targeting: {
      targetType: "single_ally",
      range: "near",
      requiresTarget: true,
      canTargetAllies: true,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "hit_bonus", amount: 2, duration: "rounds", rounds: 1 },
      { type: "apply_condition", condition: "blessed", duration: "rounds", rounds: 1 },
    ],
    tags: { magical: true, holy: true, playerOnly: true },
  },

  turn_undead: {
    id: "turn_undead",
    label: "Turn Undead",
    actorKind: "player",
    category: "control",
    phase: "combat",
    className: "Cleric",
    description: "A burst of sacred force drives undead enemies back in fear.",
    shortDescription: "Frighten undead and deal radiant damage.",
    targeting: {
      targetType: "all_enemies",
      range: "zone",
      requiresTarget: false,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "damage", amount: 4, damageType: "radiant" },
      { type: "apply_condition", condition: "frightened", duration: "rounds", rounds: 1 },
      { type: "spawn_audit_note", note: "Sacred force repelled the unquiet dead." },
    ],
    tags: { magical: true, holy: true, undeadOnlyBonus: true, playerOnly: true },
    aiHints: { preferredWhenUndeadTarget: true, openerPriority: 10 },
  },

  // =========================================================
  // PLAYER — RANGER
  // =========================================================
  mark_target: {
    id: "mark_target",
    label: "Mark Target",
    actorKind: "player",
    category: "support",
    phase: "combat",
    className: "Ranger",
    description: "Identify the enemy's pattern and expose them for follow-up attacks.",
    shortDescription: "Mark an enemy for improved focus fire.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    effectsOnUse: [
      { type: "apply_condition", condition: "marked", duration: "combat" },
      { type: "spawn_audit_note", note: "Target marked for pursuit." },
    ],
    tags: { martial: true, playerOnly: true },
  },

  volley: {
    id: "volley",
    label: "Volley",
    actorKind: "player",
    category: "attack",
    phase: "combat",
    className: "Ranger",
    description: "Loose a spread of shots into a clustered enemy group.",
    shortDescription: "Damage enemy group.",
    targeting: {
      targetType: "enemy_group",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "damage", amount: 3, damageType: "piercing" },
      { type: "spawn_audit_note", note: "Volley struck multiple hostiles." },
    ],
    tags: { martial: true, playerOnly: true },
  },

  track: {
    id: "track",
    label: "Track",
    actorKind: "player",
    category: "exploration",
    phase: "exploration",
    className: "Ranger",
    description: "Read signs, prints, scent, and disturbance to reveal movement patterns.",
    shortDescription: "Reveal pathing and reduce ambush risk.",
    targeting: {
      targetType: "zone",
      range: "zone",
      requiresTarget: false,
    },
    usage: { type: "at_will" },
    effectsOnUse: [
      { type: "reveal_tiles", amount: 2 },
      { type: "awareness_shift", amount: -1 },
      { type: "mark_zone", note: "Tracks identified and route inferred." },
    ],
    tags: { playerOnly: true },
  },

  // =========================================================
  // PLAYER — PALADIN
  // =========================================================
  smite: {
    id: "smite",
    label: "Smite",
    actorKind: "player",
    category: "attack",
    phase: "combat",
    className: "Paladin",
    description: "A consecrated strike that lands with holy force.",
    shortDescription: "High radiant melee damage.",
    targeting: {
      targetType: "single_enemy",
      range: "melee",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    hitRoll: { enabled: true, baseBonus: 1, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 4, damageType: "physical" },
      { type: "damage", amount: 3, damageType: "radiant" },
    ],
    tags: { martial: true, holy: true, undeadOnlyBonus: true, playerOnly: true },
  },

  protect: {
    id: "protect",
    label: "Protect",
    actorKind: "player",
    category: "defense",
    phase: "combat",
    className: "Paladin",
    description: "Interpose sacred resolve between danger and ally.",
    shortDescription: "Shield ally and bless them.",
    targeting: {
      targetType: "single_ally",
      range: "near",
      requiresTarget: true,
      canTargetAllies: true,
      canTargetSelf: false,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "ac_bonus", amount: 2, duration: "rounds", rounds: 1 },
      { type: "apply_condition", condition: "shielded", duration: "rounds", rounds: 1 },
      { type: "apply_condition", condition: "blessed", duration: "rounds", rounds: 1 },
    ],
    tags: { holy: true, playerOnly: true },
  },

  rally: {
    id: "rally",
    label: "Rally",
    actorKind: "player",
    category: "support",
    phase: "combat",
    className: "Paladin",
    description: "Call the party back into order and courage.",
    shortDescription: "Grant morale and small healing to allies.",
    targeting: {
      targetType: "all_allies",
      range: "zone",
      requiresTarget: false,
      canTargetAllies: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "heal", amount: 3 },
      { type: "apply_condition", condition: "inspired", duration: "rounds", rounds: 1 },
      { type: "awareness_shift", amount: -1 },
    ],
    tags: { holy: true, playerOnly: true },
  },

  // =========================================================
  // PLAYER — BARD
  // =========================================================
  inspire: {
    id: "inspire",
    label: "Inspire",
    actorKind: "player",
    category: "support",
    phase: "combat",
    className: "Bard",
    description: "Music and presence sharpen allied timing and courage.",
    shortDescription: "Give ally bonus to hit and inspired.",
    targeting: {
      targetType: "single_ally",
      range: "near",
      requiresTarget: true,
      canTargetAllies: true,
      canTargetSelf: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    effectsOnUse: [
      { type: "hit_bonus", amount: 2, duration: "rounds", rounds: 1 },
      { type: "apply_condition", condition: "inspired", duration: "rounds", rounds: 1 },
    ],
    tags: { magical: true, playerOnly: true },
  },

  distract: {
    id: "distract",
    label: "Distract",
    actorKind: "player",
    category: "control",
    phase: "combat",
    className: "Bard",
    description: "Break enemy focus with sound, wit, and disruptive rhythm.",
    shortDescription: "Expose and weaken a target.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "apply_condition", condition: "exposed", duration: "rounds", rounds: 1 },
      { type: "apply_condition", condition: "weakened", duration: "rounds", rounds: 1 },
      { type: "awareness_shift", amount: -1 },
    ],
    tags: { magical: true, playerOnly: true },
  },

  soothing_verse: {
    id: "soothing_verse",
    label: "Soothing Verse",
    actorKind: "player",
    category: "healing",
    phase: "combat",
    className: "Bard",
    description: "A calm refrain steadies breath and restores resolve.",
    shortDescription: "Heal and remove fear effects.",
    targeting: {
      targetType: "single_ally",
      range: "near",
      requiresTarget: true,
      canTargetAllies: true,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "heal", amount: 5 },
      { type: "remove_condition", condition: "frightened" },
    ],
    tags: { magical: true, playerOnly: true },
  },

  // =========================================================
  // PLAYER — DRUID
  // =========================================================
  vinesnare: {
    id: "vinesnare",
    label: "Vinesnare",
    actorKind: "player",
    category: "control",
    phase: "combat",
    className: "Druid",
    description: "Living roots lash outward and bind the enemy in place.",
    shortDescription: "Root and damage a target.",
    targeting: {
      targetType: "single_enemy",
      range: "near",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "damage", amount: 3, damageType: "physical" },
      { type: "apply_condition", condition: "rooted", duration: "rounds", rounds: 1 },
    ],
    tags: { magical: true, primal: true, playerOnly: true },
  },

  wild_shape: {
    id: "wild_shape",
    label: "Wild Shape",
    actorKind: "player",
    category: "mobility",
    phase: "combat",
    className: "Druid",
    description: "Shift into a more resilient and agile natural form.",
    shortDescription: "Gain AC, temp HP, and movement.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "ac_bonus", amount: 2, duration: "combat" },
      { type: "temp_hp", amount: 4 },
      { type: "movement", amount: 1, ignoresEngagement: true },
    ],
    tags: { magical: true, primal: true, playerOnly: true },
  },

  nature_sense: {
    id: "nature_sense",
    label: "Nature Sense",
    actorKind: "player",
    category: "exploration",
    phase: "exploration",
    className: "Druid",
    description: "Feel disturbances in the living pattern of the area.",
    shortDescription: "Lower ambush risk and reveal organic anomalies.",
    targeting: {
      targetType: "zone",
      range: "zone",
      requiresTarget: false,
    },
    usage: { type: "at_will" },
    effectsOnUse: [
      { type: "awareness_shift", amount: -1 },
      { type: "reveal_tiles", amount: 2 },
      { type: "mark_zone", note: "Natural pattern disturbance detected." },
    ],
    tags: { magical: true, primal: true, playerOnly: true },
  },

  // =========================================================
  // PLAYER — MONK
  // =========================================================
  flurry: {
    id: "flurry",
    label: "Flurry",
    actorKind: "player",
    category: "attack",
    phase: "combat",
    className: "Monk",
    description: "A sequence of rapid blows that overwhelm a target's rhythm.",
    shortDescription: "Fast multi-hit style strike.",
    targeting: {
      targetType: "single_enemy",
      range: "melee",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    hitRoll: { enabled: true, baseBonus: 2, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 2, damageType: "blunt" },
      { type: "damage", amount: 2, damageType: "blunt" },
    ],
    tags: { martial: true, playerOnly: true },
  },

  deflect: {
    id: "deflect",
    label: "Deflect",
    actorKind: "player",
    category: "reaction",
    phase: "combat",
    className: "Monk",
    description: "Redirect force and reduce incoming harm through perfect timing.",
    shortDescription: "Reaction to reduce incoming damage.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    trigger: "on_damage_taken",
    reactionEffects: [
      { type: "reduce_incoming_damage", amount: 4, duration: "instant" },
      { type: "spawn_audit_note", note: "Monk deflected part of the attack." },
    ],
    tags: { martial: true, playerOnly: true },
  },

  center_self: {
    id: "center_self",
    label: "Center Self",
    actorKind: "player",
    category: "support",
    phase: "combat",
    className: "Monk",
    description: "Regain internal balance and sharpen the next move.",
    shortDescription: "Cleanse one effect and gain focus.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "cleanse_conditions", conditions: "all_negative" },
      { type: "hit_bonus", amount: 1, duration: "rounds", rounds: 1 },
    ],
    tags: { playerOnly: true },
  },

  // =========================================================
  // PLAYER — ARTIFICER
  // =========================================================
  gadget_trap: {
    id: "gadget_trap",
    label: "Gadget Trap",
    actorKind: "player",
    category: "control",
    phase: "combat",
    className: "Artificer",
    description: "Deploy a mechanism that hinders or exposes a hostile.",
    shortDescription: "Apply exposed or rooted through tech.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "apply_condition", condition: "exposed", duration: "rounds", rounds: 1 },
      { type: "apply_condition", condition: "rooted", duration: "rounds", rounds: 1 },
    ],
    tags: { tech: true, playerOnly: true },
  },

  infuse_weapon: {
    id: "infuse_weapon",
    label: "Infuse Weapon",
    actorKind: "player",
    category: "support",
    phase: "combat",
    className: "Artificer",
    description: "Temporarily augment an ally's weapon with focused energy.",
    shortDescription: "Grant damage bonus to ally.",
    targeting: {
      targetType: "single_ally",
      range: "near",
      requiresTarget: true,
      canTargetAllies: true,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "damage_bonus", amount: 2, damageType: "arcane", duration: "rounds", rounds: 1 },
    ],
    tags: { tech: true, arcane: true, playerOnly: true },
  },

  deploy_device: {
    id: "deploy_device",
    label: "Deploy Device",
    actorKind: "player",
    category: "exploration",
    phase: "exploration",
    className: "Artificer",
    description: "Use a detection tool or utility rig to map and stabilize an area.",
    shortDescription: "Reveal and annotate a zone.",
    targeting: {
      targetType: "zone",
      range: "zone",
      requiresTarget: false,
    },
    usage: { type: "at_will" },
    effectsOnUse: [
      { type: "reveal_tiles", amount: 2 },
      { type: "mark_zone", note: "Device survey completed." },
      { type: "pressure_shift", amount: -1 },
    ],
    tags: { tech: true, playerOnly: true },
  },

  // =========================================================
  // PLAYER — SORCERER
  // =========================================================
  chaos_bolt: {
    id: "chaos_bolt",
    label: "Chaos Bolt",
    actorKind: "player",
    category: "attack",
    phase: "combat",
    className: "Sorcerer",
    description: "A volatile surge of force lashes unpredictably into the enemy.",
    shortDescription: "Arcane burst with strong damage.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    hitRoll: { enabled: true, baseBonus: 2, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 6, damageType: "arcane" },
      { type: "spawn_audit_note", note: "Chaotic magical discharge landed." },
    ],
    tags: { magical: true, arcane: true, playerOnly: true },
  },

  surge: {
    id: "surge",
    label: "Surge",
    actorKind: "player",
    category: "support",
    phase: "combat",
    className: "Sorcerer",
    description: "Draw deep from raw power and spike the next casting window.",
    shortDescription: "Boost spell impact briefly.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "damage_bonus", amount: 2, damageType: "arcane", duration: "rounds", rounds: 1 },
      { type: "hit_bonus", amount: 1, duration: "rounds", rounds: 1 },
    ],
    tags: { magical: true, arcane: true, playerOnly: true },
  },

  quickened_cast: {
    id: "quickened_cast",
    label: "Quickened Cast",
    actorKind: "player",
    category: "mobility",
    phase: "combat",
    className: "Sorcerer",
    description: "Shorten the casting window and keep tactical momentum.",
    shortDescription: "Gain initiative and action tempo.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "initiative_bonus", amount: 3, duration: "rounds", rounds: 1 },
      { type: "movement", amount: 1, ignoresEngagement: true },
    ],
    tags: { magical: true, arcane: true, playerOnly: true },
  },

  // =========================================================
  // PLAYER — WARLOCK
  // =========================================================
  hex: {
    id: "hex",
    label: "Hex",
    actorKind: "player",
    category: "control",
    phase: "combat",
    className: "Warlock",
    description: "Lay a malign binding on the enemy that weakens and tracks them.",
    shortDescription: "Hex and weaken a target.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    effectsOnUse: [
      { type: "apply_condition", condition: "hexed", duration: "combat" },
      { type: "apply_condition", condition: "weakened", duration: "rounds", rounds: 1 },
    ],
    tags: { magical: true, shadow: true, playerOnly: true },
  },

  eldritch_blast: {
    id: "eldritch_blast",
    label: "Eldritch Blast",
    actorKind: "player",
    category: "attack",
    phase: "combat",
    className: "Warlock",
    description: "A focused pact-born projection of force.",
    shortDescription: "Strong ranged shadow/arcane damage.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "at_will" },
    hitRoll: { enabled: true, baseBonus: 2, contestedBy: "ac" },
    effectsOnHit: [{ type: "damage", amount: 5, damageType: "shadow" }],
    tags: { magical: true, shadow: true, playerOnly: true },
  },

  pact_ward: {
    id: "pact_ward",
    label: "Pact Ward",
    actorKind: "player",
    category: "defense",
    phase: "combat",
    className: "Warlock",
    description: "Manifest a thin but potent pact barrier around yourself or ally.",
    shortDescription: "Grant warded and reduce damage.",
    targeting: {
      targetType: "single_ally",
      range: "near",
      requiresTarget: true,
      canTargetAllies: true,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "apply_condition", condition: "warded", duration: "rounds", rounds: 1 },
      { type: "reduce_incoming_damage", amount: 3, duration: "rounds", rounds: 1 },
    ],
    tags: { magical: true, shadow: true, playerOnly: true },
  },

  // =========================================================
  // ENEMIES
  // =========================================================
  raider_cleave: {
    id: "raider_cleave",
    label: "Raider Cleave",
    actorKind: "enemy",
    category: "attack",
    phase: "combat",
    enemyArchetype: "Orc Raider",
    description: "A savage sweeping strike meant to overwhelm the front line.",
    shortDescription: "Heavy melee damage.",
    targeting: {
      targetType: "single_enemy",
      range: "melee",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    hitRoll: { enabled: true, baseBonus: 1, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 5, damageType: "slashing" },
      { type: "apply_condition", condition: "bleeding", duration: "rounds", rounds: 1 },
    ],
    tags: { enemyOnly: true, martial: true },
    aiHints: { openerPriority: 7 },
  },

  raider_frenzy: {
    id: "raider_frenzy",
    label: "Raider Frenzy",
    actorKind: "enemy",
    category: "support",
    phase: "combat",
    enemyArchetype: "Orc Raider",
    description: "Violent momentum boosts aggression at the cost of discipline.",
    shortDescription: "Increase damage and pressure.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "damage_bonus", amount: 2, duration: "rounds", rounds: 2 },
      { type: "pressure_shift", amount: 1 },
      { type: "apply_condition", condition: "vulnerable", duration: "rounds", rounds: 1 },
    ],
    tags: { enemyOnly: true, martial: true },
  },

  skirmisher_harass: {
    id: "skirmisher_harass",
    label: "Skirmisher Harass",
    actorKind: "enemy",
    category: "mobility",
    phase: "combat",
    enemyArchetype: "Goblin Skirmisher",
    description: "A hit-and-fade attack designed to unsettle the party's formation.",
    shortDescription: "Damage, move, and raise awareness.",
    targeting: {
      targetType: "single_enemy",
      range: "near",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    effectsOnUse: [
      { type: "damage", amount: 3, damageType: "piercing" },
      { type: "movement", amount: 1, ignoresEngagement: true },
      { type: "awareness_shift", amount: 1 },
    ],
    tags: { enemyOnly: true, stealth: true },
  },

  skirmisher_smoke: {
    id: "skirmisher_smoke",
    label: "Skirmisher Smoke",
    actorKind: "enemy",
    category: "control",
    phase: "combat",
    enemyArchetype: "Goblin Skirmisher",
    description: "A cloud of confusion hides movement and spoils reaction windows.",
    shortDescription: "Become hidden and expose party rhythm.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "apply_condition", condition: "hidden", duration: "rounds", rounds: 1 },
      { type: "awareness_shift", amount: 1 },
      { type: "spawn_audit_note", note: "Smoke cover reduced visibility." },
    ],
    tags: { enemyOnly: true, stealth: true },
  },

  cultist_hex: {
    id: "cultist_hex",
    label: "Cultist Hex",
    actorKind: "enemy",
    category: "control",
    phase: "combat",
    enemyArchetype: "Dark Cultist",
    description: "A spiteful curse that degrades the target's effectiveness.",
    shortDescription: "Hex and weaken target.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    effectsOnUse: [
      { type: "apply_condition", condition: "hexed", duration: "combat" },
      { type: "apply_condition", condition: "weakened", duration: "rounds", rounds: 1 },
    ],
    tags: { enemyOnly: true, magical: true, shadow: true },
  },

  cultist_drain: {
    id: "cultist_drain",
    label: "Cultist Drain",
    actorKind: "enemy",
    category: "attack",
    phase: "combat",
    enemyArchetype: "Dark Cultist",
    description: "Leech vitality through forbidden ritual force.",
    shortDescription: "Necrotic damage and self-heal.",
    targeting: {
      targetType: "single_enemy",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    hitRoll: { enabled: true, baseBonus: 1, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 4, damageType: "necrotic" },
      { type: "heal", amount: 3 },
    ],
    tags: { enemyOnly: true, magical: true, shadow: true },
  },

  undead_slash: {
    id: "undead_slash",
    label: "Undead Slash",
    actorKind: "enemy",
    category: "attack",
    phase: "combat",
    enemyArchetype: "Undead Knight",
    description: "A cold relentless strike from a remorseless foe.",
    shortDescription: "Heavy melee damage.",
    targeting: {
      targetType: "single_enemy",
      range: "melee",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    hitRoll: { enabled: true, baseBonus: 1, contestedBy: "ac" },
    effectsOnHit: [{ type: "damage", amount: 5, damageType: "slashing" }],
    tags: { enemyOnly: true, martial: true },
  },

  deathless_march: {
    id: "deathless_march",
    label: "Deathless March",
    actorKind: "enemy",
    category: "defense",
    phase: "combat",
    enemyArchetype: "Undead Knight",
    description: "A grim advance that hardens the undead shell against interruption.",
    shortDescription: "Gain shielded and pressure.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "apply_condition", condition: "shielded", duration: "rounds", rounds: 2 },
      { type: "reduce_incoming_damage", amount: 2, duration: "rounds", rounds: 2 },
      { type: "pressure_shift", amount: 1 },
    ],
    tags: { enemyOnly: true },
  },

  bandit_volley: {
    id: "bandit_volley",
    label: "Bandit Volley",
    actorKind: "enemy",
    category: "attack",
    phase: "combat",
    enemyArchetype: "Bandit Archer",
    description: "A coordinated storm of arrows into exposed targets.",
    shortDescription: "Ranged group pressure attack.",
    targeting: {
      targetType: "enemy_group",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "damage", amount: 3, damageType: "piercing" },
      { type: "apply_condition", condition: "exposed", duration: "end_of_turn" },
    ],
    tags: { enemyOnly: true, martial: true },
  },

  suppressing_fire: {
    id: "suppressing_fire",
    label: "Suppressing Fire",
    actorKind: "enemy",
    category: "control",
    phase: "combat",
    enemyArchetype: "Bandit Archer",
    description: "Force the party into hesitation and poor movement lanes.",
    shortDescription: "Raise awareness and root tempo.",
    targeting: {
      targetType: "enemy_group",
      range: "ranged",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_combat", maxUses: 1 },
    effectsOnUse: [
      { type: "awareness_shift", amount: 1 },
      { type: "apply_condition", condition: "revealed", duration: "rounds", rounds: 1 },
      { type: "spawn_audit_note", note: "Suppressing fire constrained safe movement." },
    ],
    tags: { enemyOnly: true, martial: true },
  },

  shadow_strike: {
    id: "shadow_strike",
    label: "Shadow Strike",
    actorKind: "enemy",
    category: "attack",
    phase: "combat",
    enemyArchetype: "Shadow Assassin",
    description: "A fast lethal strike from concealment.",
    shortDescription: "Strong opener damage from stealth.",
    targeting: {
      targetType: "single_enemy",
      range: "melee",
      requiresTarget: true,
      canTargetEnemies: true,
    },
    usage: { type: "per_turn", maxUses: 1 },
    hitRoll: { enabled: true, baseBonus: 3, contestedBy: "ac" },
    effectsOnHit: [
      { type: "damage", amount: 4, damageType: "shadow" },
      { type: "damage", amount: 3, damageType: "piercing", bonusIfCondition: "revealed" },
    ],
    tags: { enemyOnly: true, stealth: true, shadow: true, openerOnly: true },
    aiHints: { openerPriority: 10 },
  },

  vanish: {
    id: "vanish",
    label: "Vanish",
    actorKind: "enemy",
    category: "mobility",
    phase: "combat",
    enemyArchetype: "Shadow Assassin",
    description: "Slip from sight and reset the kill angle.",
    shortDescription: "Hide and reposition.",
    targeting: {
      targetType: "self",
      range: "self",
      requiresTarget: false,
      canTargetSelf: true,
    },
    usage: { type: "per_combat", maxUses: 2 },
    effectsOnUse: [
      { type: "apply_condition", condition: "hidden", duration: "rounds", rounds: 1 },
      { type: "movement", amount: 2, ignoresEngagement: true },
    ],
    tags: { enemyOnly: true, stealth: true, shadow: true },
  },
};

export function getSkillDefinition(skillId: string): SkillDefinition | null {
  return SKILL_DEFINITIONS[skillId] ?? null;
}

export function getAllSkillDefinitions(): SkillDefinition[] {
  return Object.values(SKILL_DEFINITIONS);
}
