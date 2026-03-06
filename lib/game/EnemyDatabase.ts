// lib/game/EnemyDatabase.ts

import { getSkillsForEnemyArchetype } from "@/lib/skills/classSkillMap";

export type EnemyRole =
  | "brute"
  | "soldier"
  | "skirmisher"
  | "archer"
  | "caster"
  | "assassin"
  | "controller"
  | "support"
  | "beast"
  | "undead"
  | "construct"
  | "boss";

export type EnemyTier = "common" | "elite" | "boss";

export type EnemyPressureBand = "low" | "medium" | "high" | "extreme";

export type EnemyFaction =
  | "bandit"
  | "goblinoid"
  | "orc"
  | "undead"
  | "beast"
  | "cult"
  | "construct"
  | "infernal"
  | "ancient";

export type EnemyDamageType =
  | "physical"
  | "piercing"
  | "slashing"
  | "bludgeoning"
  | "fire"
  | "cold"
  | "lightning"
  | "necrotic"
  | "radiant"
  | "poison"
  | "psychic"
  | "force"
  | "shadow";

export type EnemyConditionId =
  | "bleeding"
  | "burning"
  | "chilled"
  | "poisoned"
  | "frightened"
  | "stunned"
  | "restrained"
  | "weakened"
  | "marked"
  | "exposed"
  | "hexed"
  | "revealed"
  | "hidden"
  | "shielded"
  | "regenerating";

export type EnemyActionKind =
  | "melee"
  | "ranged"
  | "spell"
  | "control"
  | "support"
  | "passive"
  | "reaction";

export type EnemyAction = {
  id: string;
  label: string;
  kind: EnemyActionKind;
  description: string;
  range: "self" | "melee" | "near" | "ranged" | "zone";
  toHitBonus?: number;
  saveDC?: number;
  damage?: {
    diceCount: number;
    diceSides: number;
    bonus: number;
    type: EnemyDamageType;
  };
  applyCondition?: {
    condition: EnemyConditionId;
    rounds?: number;
  };
  usage?: "at_will" | "per_turn" | "per_combat";
  notes?: string[];
};

export type EnemyDefenses = {
  ac: number;
  hp: number;
  speed: number;
  resistances?: EnemyDamageType[];
  vulnerabilities?: EnemyDamageType[];
  conditionImmunities?: EnemyConditionId[];
};

export type EnemyBehaviorProfile = {
  aggression: number; // 1-10
  discipline: number; // 1-10
  prefersWeakTargets?: boolean;
  prefersBackline?: boolean;
  protectsAllies?: boolean;
  opensFromRange?: boolean;
  usesControlEarly?: boolean;
};

export type EnemyArchetypeKey =
  | "Bandit Archer"
  | "Bandit Warrior"
  | "Bandit Rogue"
  | "Bandit Captain"
  | "Goblin Skirmisher"
  | "Goblin Archer"
  | "Hobgoblin Soldier"
  | "Orc Raider"
  | "Orc Warlord"
  | "Skeleton Warrior"
  | "Skeleton Archer"
  | "Zombie"
  | "Ghoul"
  | "Wraith"
  | "Cultist Acolyte"
  | "Cult Assassin"
  | "Cult Knight"
  | "Cult Priest"
  | "Arcane Drone"
  | "Arcane Sentinel"
  | "Stone Golem"
  | "Iron Guardian"
  | "Wolf"
  | "Dire Wolf"
  | "Giant Spider"
  | "Hellhound"
  | "Ancient Warden"
  | "Void Horror";

export type EnemyDefinition = {
  id: string;
  slug: string;
  name: EnemyArchetypeKey;
  faction: EnemyFaction;
  role: EnemyRole;
  tier: EnemyTier;
  pressureBand: EnemyPressureBand;

  levelHint: number;
  challengeHint: number; // D&D-adjacent feel, not strict CR

  portraitKey: string;
  groupLabel?: string;

  archetypeSkillSource?: string;
  skillIds: string[];

  defenses: EnemyDefenses;
  actions: EnemyAction[];
  behavior: EnemyBehaviorProfile;

  lootTags?: string[];
  tags?: string[];
};

export type EnemyDefinitionMap = Record<string, EnemyDefinition>;

function slugify(v: string) {
  return String(v)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function makeEnemy(args: Omit<EnemyDefinition, "slug">): EnemyDefinition {
  return {
    ...args,
    slug: slugify(args.name),
  };
}

export const ENEMY_DATABASE: EnemyDefinitionMap = {
  bandit_archer: makeEnemy({
    id: "enemy_bandit_archer",
    name: "Bandit Archer",
    faction: "bandit",
    role: "archer",
    tier: "common",
    pressureBand: "low",
    levelHint: 1,
    challengeHint: 1,
    portraitKey: "Enemy_Bandit_Archer",
    groupLabel: "Archers",
    archetypeSkillSource: "Bandit Archer",
    skillIds: getSkillsForEnemyArchetype("Bandit Archer"),
    defenses: {
      ac: 13,
      hp: 11,
      speed: 30,
    },
    actions: [
      {
        id: "shortbow",
        label: "Shortbow",
        kind: "ranged",
        description: "A practiced shot from cover.",
        range: "ranged",
        toHitBonus: 4,
        damage: { diceCount: 1, diceSides: 6, bonus: 2, type: "piercing" },
        usage: "at_will",
      },
      {
        id: "volley_fire",
        label: "Volley Fire",
        kind: "ranged",
        description: "Loose a tight cluster of arrows into a lane.",
        range: "zone",
        damage: { diceCount: 1, diceSides: 4, bonus: 2, type: "piercing" },
        applyCondition: { condition: "exposed", rounds: 1 },
        usage: "per_combat",
      },
    ],
    behavior: {
      aggression: 5,
      discipline: 6,
      prefersBackline: true,
      opensFromRange: true,
    },
    lootTags: ["arrows", "light_armor"],
    tags: ["humanoid", "ranged"],
  }),

  bandit_warrior: makeEnemy({
    id: "enemy_bandit_warrior",
    name: "Bandit Warrior",
    faction: "bandit",
    role: "soldier",
    tier: "common",
    pressureBand: "low",
    levelHint: 1,
    challengeHint: 1,
    portraitKey: "Enemy_Bandit_Warrior",
    groupLabel: "Shields",
    archetypeSkillSource: "Orc Raider",
    skillIds: getSkillsForEnemyArchetype("Orc Raider"),
    defenses: {
      ac: 15,
      hp: 16,
      speed: 30,
    },
    actions: [
      {
        id: "blade_strike",
        label: "Blade Strike",
        kind: "melee",
        description: "A direct martial attack.",
        range: "melee",
        toHitBonus: 4,
        damage: { diceCount: 1, diceSides: 8, bonus: 2, type: "slashing" },
        usage: "at_will",
      },
      {
        id: "shield_press",
        label: "Shield Press",
        kind: "control",
        description: "Crowd the target and drive them off balance.",
        range: "melee",
        damage: { diceCount: 1, diceSides: 4, bonus: 2, type: "bludgeoning" },
        applyCondition: { condition: "exposed", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 6,
      discipline: 5,
      protectsAllies: true,
    },
    lootTags: ["shield", "weapon"],
    tags: ["humanoid", "frontline"],
  }),

  bandit_rogue: makeEnemy({
    id: "enemy_bandit_rogue",
    name: "Bandit Rogue",
    faction: "bandit",
    role: "assassin",
    tier: "common",
    pressureBand: "medium",
    levelHint: 2,
    challengeHint: 2,
    portraitKey: "Enemy_Bandit_Rogue",
    groupLabel: "Stalkers",
    archetypeSkillSource: "Shadow Assassin",
    skillIds: getSkillsForEnemyArchetype("Shadow Assassin"),
    defenses: {
      ac: 14,
      hp: 14,
      speed: 35,
    },
    actions: [
      {
        id: "knife_strike",
        label: "Knife Strike",
        kind: "melee",
        description: "A fast stab from a blind angle.",
        range: "melee",
        toHitBonus: 5,
        damage: { diceCount: 1, diceSides: 6, bonus: 3, type: "piercing" },
        usage: "at_will",
      },
      {
        id: "shadow_cut",
        label: "Shadow Cut",
        kind: "control",
        description: "Slip in and open the target to follow-up punishment.",
        range: "melee",
        damage: { diceCount: 1, diceSides: 4, bonus: 3, type: "slashing" },
        applyCondition: { condition: "exposed", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 7,
      discipline: 6,
      prefersWeakTargets: true,
      prefersBackline: true,
    },
    lootTags: ["dagger", "pouch"],
    tags: ["humanoid", "stealth"],
  }),

  bandit_captain: makeEnemy({
    id: "enemy_bandit_captain",
    name: "Bandit Captain",
    faction: "bandit",
    role: "support",
    tier: "elite",
    pressureBand: "medium",
    levelHint: 3,
    challengeHint: 3,
    portraitKey: "Enemy_Bandit_Captain",
    archetypeSkillSource: "Orc Raider",
    skillIds: getSkillsForEnemyArchetype("Orc Raider"),
    defenses: {
      ac: 16,
      hp: 32,
      speed: 30,
    },
    actions: [
      {
        id: "captains_blade",
        label: "Captain's Blade",
        kind: "melee",
        description: "A disciplined strike backed by command presence.",
        range: "melee",
        toHitBonus: 5,
        damage: { diceCount: 1, diceSides: 8, bonus: 3, type: "slashing" },
        usage: "at_will",
      },
      {
        id: "rally_raiders",
        label: "Rally Raiders",
        kind: "support",
        description: "Call allies back into formation and aggression.",
        range: "zone",
        applyCondition: { condition: "marked", rounds: 1 },
        usage: "per_combat",
        notes: ["Enemy allies become more aggressive."],
      },
    ],
    behavior: {
      aggression: 6,
      discipline: 8,
      protectsAllies: true,
      usesControlEarly: true,
    },
    lootTags: ["coin", "officer_blade"],
    tags: ["humanoid", "leader"],
  }),

  goblin_skirmisher: makeEnemy({
    id: "enemy_goblin_skirmisher",
    name: "Goblin Skirmisher",
    faction: "goblinoid",
    role: "skirmisher",
    tier: "common",
    pressureBand: "medium",
    levelHint: 1,
    challengeHint: 1,
    portraitKey: "Enemy_Goblin_Skirmisher",
    groupLabel: "Skirmishers",
    archetypeSkillSource: "Goblin Skirmisher",
    skillIds: getSkillsForEnemyArchetype("Goblin Skirmisher"),
    defenses: {
      ac: 14,
      hp: 10,
      speed: 35,
    },
    actions: [
      {
        id: "quick_stab",
        label: "Quick Stab",
        kind: "melee",
        description: "A light, nasty hit-and-run attack.",
        range: "melee",
        toHitBonus: 4,
        damage: { diceCount: 1, diceSides: 6, bonus: 2, type: "piercing" },
        usage: "at_will",
      },
      {
        id: "smoke_pot",
        label: "Smoke Pot",
        kind: "control",
        description: "Spoil lines of sight and create confusion.",
        range: "near",
        applyCondition: { condition: "hidden", rounds: 1 },
        usage: "per_combat",
      },
    ],
    behavior: {
      aggression: 6,
      discipline: 4,
      prefersWeakTargets: true,
      prefersBackline: true,
    },
    lootTags: ["scrap", "poison_vial"],
    tags: ["goblinoid", "mobile"],
  }),

  goblin_archer: makeEnemy({
    id: "enemy_goblin_archer",
    name: "Goblin Archer",
    faction: "goblinoid",
    role: "archer",
    tier: "common",
    pressureBand: "low",
    levelHint: 1,
    challengeHint: 1,
    portraitKey: "Enemy_Goblin_Archer",
    groupLabel: "Archers",
    archetypeSkillSource: "Bandit Archer",
    skillIds: getSkillsForEnemyArchetype("Bandit Archer"),
    defenses: {
      ac: 13,
      hp: 9,
      speed: 30,
    },
    actions: [
      {
        id: "crooked_bow",
        label: "Crooked Bow",
        kind: "ranged",
        description: "A dirty but serviceable shot.",
        range: "ranged",
        toHitBonus: 4,
        damage: { diceCount: 1, diceSides: 6, bonus: 1, type: "piercing" },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 5,
      discipline: 3,
      prefersBackline: true,
      opensFromRange: true,
    },
    lootTags: ["arrows"],
    tags: ["goblinoid", "ranged"],
  }),

  hobgoblin_soldier: makeEnemy({
    id: "enemy_hobgoblin_soldier",
    name: "Hobgoblin Soldier",
    faction: "goblinoid",
    role: "soldier",
    tier: "elite",
    pressureBand: "medium",
    levelHint: 3,
    challengeHint: 3,
    portraitKey: "Enemy_Hobgoblin_Soldier",
    groupLabel: "Shields",
    archetypeSkillSource: "Orc Raider",
    skillIds: getSkillsForEnemyArchetype("Orc Raider"),
    defenses: {
      ac: 17,
      hp: 28,
      speed: 30,
    },
    actions: [
      {
        id: "martial_thrust",
        label: "Martial Thrust",
        kind: "melee",
        description: "A clean professional spear attack.",
        range: "melee",
        toHitBonus: 5,
        damage: { diceCount: 1, diceSides: 8, bonus: 2, type: "piercing" },
        usage: "at_will",
      },
      {
        id: "formation_guard",
        label: "Formation Guard",
        kind: "support",
        description: "Tighten formation and reduce party openings.",
        range: "zone",
        applyCondition: { condition: "shielded", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 6,
      discipline: 9,
      protectsAllies: true,
    },
    lootTags: ["spear", "shield"],
    tags: ["goblinoid", "disciplined"],
  }),

  orc_raider: makeEnemy({
    id: "enemy_orc_raider",
    name: "Orc Raider",
    faction: "orc",
    role: "brute",
    tier: "common",
    pressureBand: "medium",
    levelHint: 2,
    challengeHint: 2,
    portraitKey: "Enemy_Orc_Raider",
    groupLabel: "Brutes",
    archetypeSkillSource: "Orc Raider",
    skillIds: getSkillsForEnemyArchetype("Orc Raider"),
    defenses: {
      ac: 13,
      hp: 22,
      speed: 30,
    },
    actions: [
      {
        id: "greataxe",
        label: "Greataxe",
        kind: "melee",
        description: "A heavy chopping swing.",
        range: "melee",
        toHitBonus: 5,
        damage: { diceCount: 1, diceSides: 12, bonus: 3, type: "slashing" },
        usage: "at_will",
      },
      {
        id: "feral_charge",
        label: "Feral Charge",
        kind: "melee",
        description: "Rush in and hit with momentum.",
        range: "near",
        damage: { diceCount: 1, diceSides: 10, bonus: 3, type: "bludgeoning" },
        applyCondition: { condition: "exposed", rounds: 1 },
        usage: "per_combat",
      },
    ],
    behavior: {
      aggression: 9,
      discipline: 3,
      prefersWeakTargets: false,
    },
    lootTags: ["greataxe", "hide"],
    tags: ["orc", "frontline"],
  }),

  orc_warlord: makeEnemy({
    id: "enemy_orc_warlord",
    name: "Orc Warlord",
    faction: "orc",
    role: "boss",
    tier: "boss",
    pressureBand: "high",
    levelHint: 5,
    challengeHint: 6,
    portraitKey: "Enemy_Orc_Warlord",
    archetypeSkillSource: "Orc Raider",
    skillIds: getSkillsForEnemyArchetype("Orc Raider"),
    defenses: {
      ac: 17,
      hp: 68,
      speed: 30,
    },
    actions: [
      {
        id: "warlords_cleave",
        label: "Warlord's Cleave",
        kind: "melee",
        description: "A sweeping strike meant to break two heroes at once.",
        range: "melee",
        toHitBonus: 7,
        damage: { diceCount: 2, diceSides: 8, bonus: 4, type: "slashing" },
        usage: "at_will",
      },
      {
        id: "war_cry",
        label: "War Cry",
        kind: "support",
        description: "Drive allied aggression upward.",
        range: "zone",
        applyCondition: { condition: "marked", rounds: 1 },
        usage: "per_combat",
        notes: ["Nearby enemies become more aggressive."],
      },
    ],
    behavior: {
      aggression: 10,
      discipline: 6,
      protectsAllies: false,
      usesControlEarly: true,
    },
    lootTags: ["boss_weapon", "trophy"],
    tags: ["orc", "boss"],
  }),

  skeleton_warrior: makeEnemy({
    id: "enemy_skeleton_warrior",
    name: "Skeleton Warrior",
    faction: "undead",
    role: "soldier",
    tier: "common",
    pressureBand: "medium",
    levelHint: 2,
    challengeHint: 2,
    portraitKey: "Enemy_Skeleton_Warrior",
    groupLabel: "Grid Knights",
    archetypeSkillSource: "Undead Knight",
    skillIds: getSkillsForEnemyArchetype("Undead Knight"),
    defenses: {
      ac: 14,
      hp: 18,
      speed: 30,
      vulnerabilities: ["bludgeoning"],
      conditionImmunities: ["frightened", "poisoned"],
    },
    actions: [
      {
        id: "rusted_blade",
        label: "Rusted Blade",
        kind: "melee",
        description: "A relentless undead slash.",
        range: "melee",
        toHitBonus: 4,
        damage: { diceCount: 1, diceSides: 8, bonus: 2, type: "slashing" },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 6,
      discipline: 7,
    },
    lootTags: ["bones", "rusted_weapon"],
    tags: ["undead"],
  }),

  skeleton_archer: makeEnemy({
    id: "enemy_skeleton_archer",
    name: "Skeleton Archer",
    faction: "undead",
    role: "archer",
    tier: "common",
    pressureBand: "medium",
    levelHint: 2,
    challengeHint: 2,
    portraitKey: "Enemy_Skeleton_Archer",
    groupLabel: "Archers",
    archetypeSkillSource: "Bandit Archer",
    skillIds: getSkillsForEnemyArchetype("Bandit Archer"),
    defenses: {
      ac: 13,
      hp: 13,
      speed: 30,
      vulnerabilities: ["bludgeoning"],
      conditionImmunities: ["frightened", "poisoned"],
    },
    actions: [
      {
        id: "bone_arrow",
        label: "Bone Arrow",
        kind: "ranged",
        description: "An unnervingly precise undead shot.",
        range: "ranged",
        toHitBonus: 4,
        damage: { diceCount: 1, diceSides: 6, bonus: 2, type: "piercing" },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 5,
      discipline: 8,
      opensFromRange: true,
    },
    lootTags: ["bone_fragments"],
    tags: ["undead", "ranged"],
  }),

  zombie: makeEnemy({
    id: "enemy_zombie",
    name: "Zombie",
    faction: "undead",
    role: "undead",
    tier: "common",
    pressureBand: "low",
    levelHint: 1,
    challengeHint: 1,
    portraitKey: "Enemy_Zombie",
    archetypeSkillSource: "Undead Knight",
    skillIds: getSkillsForEnemyArchetype("Undead Knight"),
    defenses: {
      ac: 8,
      hp: 24,
      speed: 20,
      conditionImmunities: ["frightened", "poisoned"],
    },
    actions: [
      {
        id: "rotting_slam",
        label: "Rotting Slam",
        kind: "melee",
        description: "A slow but heavy corpse-blow.",
        range: "melee",
        toHitBonus: 3,
        damage: { diceCount: 1, diceSides: 6, bonus: 2, type: "bludgeoning" },
        usage: "at_will",
      },
      {
        id: "infected_grab",
        label: "Infected Grab",
        kind: "control",
        description: "Drag the target into the dead weight of the horde.",
        range: "melee",
        applyCondition: { condition: "restrained", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 5,
      discipline: 1,
    },
    lootTags: ["rot", "grave_goods"],
    tags: ["undead", "slow"],
  }),

  ghoul: makeEnemy({
    id: "enemy_ghoul",
    name: "Ghoul",
    faction: "undead",
    role: "assassin",
    tier: "elite",
    pressureBand: "medium",
    levelHint: 3,
    challengeHint: 3,
    portraitKey: "Enemy_Ghoul",
    archetypeSkillSource: "Shadow Assassin",
    skillIds: getSkillsForEnemyArchetype("Shadow Assassin"),
    defenses: {
      ac: 13,
      hp: 27,
      speed: 30,
      conditionImmunities: ["poisoned"],
    },
    actions: [
      {
        id: "paralytic_claw",
        label: "Paralytic Claw",
        kind: "melee",
        description: "A corpse-fast claw that can freeze the body in fear.",
        range: "melee",
        toHitBonus: 5,
        damage: { diceCount: 2, diceSides: 4, bonus: 2, type: "slashing" },
        applyCondition: { condition: "stunned", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 8,
      discipline: 4,
      prefersWeakTargets: true,
      prefersBackline: true,
    },
    lootTags: ["bone_trinket"],
    tags: ["undead", "predator"],
  }),

  wraith: makeEnemy({
    id: "enemy_wraith",
    name: "Wraith",
    faction: "undead",
    role: "undead",
    tier: "elite",
    pressureBand: "high",
    levelHint: 4,
    challengeHint: 4,
    portraitKey: "Enemy_Wraith",
    groupLabel: "Wraiths",
    archetypeSkillSource: "Undead Knight",
    skillIds: getSkillsForEnemyArchetype("Undead Knight"),
    defenses: {
      ac: 15,
      hp: 38,
      speed: 40,
      resistances: ["physical", "piercing", "slashing", "bludgeoning"],
      conditionImmunities: ["frightened", "restrained", "poisoned"],
    },
    actions: [
      {
        id: "phase_touch",
        label: "Phase Touch",
        kind: "spell",
        description: "Drain warmth and vitality through spectral contact.",
        range: "near",
        toHitBonus: 6,
        damage: { diceCount: 2, diceSides: 6, bonus: 0, type: "necrotic" },
        usage: "at_will",
      },
      {
        id: "terror_glide",
        label: "Terror Glide",
        kind: "control",
        description: "Pass through the line and panic the living.",
        range: "zone",
        applyCondition: { condition: "frightened", rounds: 1 },
        usage: "per_combat",
      },
    ],
    behavior: {
      aggression: 7,
      discipline: 7,
      prefersBackline: true,
      usesControlEarly: true,
    },
    lootTags: ["ectoplasm"],
    tags: ["undead", "spectral"],
  }),

  cultist_acolyte: makeEnemy({
    id: "enemy_cultist_acolyte",
    name: "Cultist Acolyte",
    faction: "cult",
    role: "caster",
    tier: "common",
    pressureBand: "medium",
    levelHint: 2,
    challengeHint: 2,
    portraitKey: "Enemy_Cultist_Acolyte",
    groupLabel: "Casters",
    archetypeSkillSource: "Dark Cultist",
    skillIds: getSkillsForEnemyArchetype("Dark Cultist"),
    defenses: {
      ac: 12,
      hp: 15,
      speed: 30,
    },
    actions: [
      {
        id: "dark_bolt",
        label: "Dark Bolt",
        kind: "spell",
        description: "A malign ranged blast.",
        range: "ranged",
        toHitBonus: 4,
        damage: { diceCount: 1, diceSides: 8, bonus: 2, type: "shadow" },
        usage: "at_will",
      },
      {
        id: "whisper_hex",
        label: "Whisper Hex",
        kind: "control",
        description: "Corrupt the target's footing and confidence.",
        range: "ranged",
        applyCondition: { condition: "hexed", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 5,
      discipline: 6,
      prefersBackline: true,
      usesControlEarly: true,
    },
    lootTags: ["ritual_dust"],
    tags: ["cult", "magic"],
  }),

  cult_assassin: makeEnemy({
    id: "enemy_cult_assassin",
    name: "Cult Assassin",
    faction: "cult",
    role: "assassin",
    tier: "elite",
    pressureBand: "high",
    levelHint: 4,
    challengeHint: 4,
    portraitKey: "Enemy_Cult_Assassin",
    groupLabel: "Stalkers",
    archetypeSkillSource: "Shadow Assassin",
    skillIds: getSkillsForEnemyArchetype("Shadow Assassin"),
    defenses: {
      ac: 15,
      hp: 31,
      speed: 35,
    },
    actions: [
      {
        id: "shadow_blade",
        label: "Shadow Blade",
        kind: "melee",
        description: "A precise killing strike enhanced by darkness.",
        range: "melee",
        toHitBonus: 6,
        damage: { diceCount: 2, diceSides: 6, bonus: 2, type: "shadow" },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 8,
      discipline: 7,
      prefersWeakTargets: true,
      prefersBackline: true,
    },
    lootTags: ["poison", "black_veil"],
    tags: ["cult", "stealth"],
  }),

  cult_knight: makeEnemy({
    id: "enemy_cult_knight",
    name: "Cult Knight",
    faction: "cult",
    role: "soldier",
    tier: "elite",
    pressureBand: "high",
    levelHint: 4,
    challengeHint: 4,
    portraitKey: "Enemy_Cult_Knight",
    groupLabel: "Shields",
    archetypeSkillSource: "Undead Knight",
    skillIds: getSkillsForEnemyArchetype("Undead Knight"),
    defenses: {
      ac: 17,
      hp: 40,
      speed: 30,
    },
    actions: [
      {
        id: "corrupted_blade",
        label: "Corrupted Blade",
        kind: "melee",
        description: "A heavy strike carrying dark ritual force.",
        range: "melee",
        toHitBonus: 6,
        damage: { diceCount: 1, diceSides: 10, bonus: 3, type: "slashing" },
        usage: "at_will",
      },
      {
        id: "blasphemous_guard",
        label: "Blasphemous Guard",
        kind: "support",
        description: "Reinforce their shell and hold the line.",
        range: "self",
        applyCondition: { condition: "shielded", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 6,
      discipline: 8,
      protectsAllies: true,
    },
    lootTags: ["dark_plate"],
    tags: ["cult", "armored"],
  }),

  cult_priest: makeEnemy({
    id: "enemy_cult_priest",
    name: "Cult Priest",
    faction: "cult",
    role: "support",
    tier: "elite",
    pressureBand: "high",
    levelHint: 4,
    challengeHint: 4,
    portraitKey: "Enemy_Cult_Priest",
    groupLabel: "Casters",
    archetypeSkillSource: "Dark Cultist",
    skillIds: getSkillsForEnemyArchetype("Dark Cultist"),
    defenses: {
      ac: 13,
      hp: 34,
      speed: 30,
    },
    actions: [
      {
        id: "dark_heal",
        label: "Dark Heal",
        kind: "support",
        description: "Restore a fallen cult ally's strength.",
        range: "near",
        usage: "per_combat",
        notes: ["Heals an allied enemy substantially."],
      },
      {
        id: "unholy_lance",
        label: "Unholy Lance",
        kind: "spell",
        description: "A black-gold spear of force and rot.",
        range: "ranged",
        toHitBonus: 5,
        damage: { diceCount: 2, diceSides: 6, bonus: 0, type: "necrotic" },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 4,
      discipline: 8,
      protectsAllies: true,
      usesControlEarly: true,
    },
    lootTags: ["ritual_focus"],
    tags: ["cult", "support"],
  }),

  arcane_drone: makeEnemy({
    id: "enemy_arcane_drone",
    name: "Arcane Drone",
    faction: "construct",
    role: "construct",
    tier: "common",
    pressureBand: "medium",
    levelHint: 2,
    challengeHint: 2,
    portraitKey: "Enemy_Arcane_Drone",
    groupLabel: "Drones",
    archetypeSkillSource: "Bandit Archer",
    skillIds: getSkillsForEnemyArchetype("Bandit Archer"),
    defenses: {
      ac: 14,
      hp: 18,
      speed: 0,
      resistances: ["poison", "psychic"],
      conditionImmunities: ["frightened", "poisoned"],
    },
    actions: [
      {
        id: "energy_bolt",
        label: "Energy Bolt",
        kind: "ranged",
        description: "A narrow arcane beam.",
        range: "ranged",
        toHitBonus: 5,
        damage: { diceCount: 1, diceSides: 8, bonus: 2, type: "force" },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 5,
      discipline: 9,
      opensFromRange: true,
    },
    lootTags: ["arcane_core"],
    tags: ["construct", "ranged"],
  }),

  arcane_sentinel: makeEnemy({
    id: "enemy_arcane_sentinel",
    name: "Arcane Sentinel",
    faction: "construct",
    role: "construct",
    tier: "elite",
    pressureBand: "high",
    levelHint: 4,
    challengeHint: 4,
    portraitKey: "Enemy_Arcane_Sentinel",
    groupLabel: "Sentries",
    archetypeSkillSource: "Bandit Archer",
    skillIds: getSkillsForEnemyArchetype("Bandit Archer"),
    defenses: {
      ac: 18,
      hp: 44,
      speed: 20,
      resistances: ["poison", "psychic"],
      conditionImmunities: ["frightened", "poisoned"],
    },
    actions: [
      {
        id: "beam_lance",
        label: "Beam Lance",
        kind: "ranged",
        description: "A precise hard-light beam.",
        range: "ranged",
        toHitBonus: 6,
        damage: { diceCount: 2, diceSides: 6, bonus: 2, type: "force" },
        usage: "at_will",
      },
      {
        id: "barrier_phase",
        label: "Barrier Phase",
        kind: "support",
        description: "Raise a temporary defensive lattice.",
        range: "self",
        applyCondition: { condition: "shielded", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 5,
      discipline: 10,
      protectsAllies: true,
    },
    lootTags: ["sentinel_lens"],
    tags: ["construct", "elite"],
  }),

  stone_golem: makeEnemy({
    id: "enemy_stone_golem",
    name: "Stone Golem",
    faction: "construct",
    role: "construct",
    tier: "elite",
    pressureBand: "high",
    levelHint: 5,
    challengeHint: 5,
    portraitKey: "Enemy_Stone_Golem",
    groupLabel: "Brutes",
    archetypeSkillSource: "Orc Raider",
    skillIds: getSkillsForEnemyArchetype("Orc Raider"),
    defenses: {
      ac: 18,
      hp: 65,
      speed: 20,
      resistances: ["physical", "poison"],
      conditionImmunities: ["frightened", "poisoned", "stunned"],
    },
    actions: [
      {
        id: "ground_slam",
        label: "Ground Slam",
        kind: "melee",
        description: "Crush the ground and everyone on it.",
        range: "near",
        toHitBonus: 7,
        damage: { diceCount: 2, diceSides: 8, bonus: 4, type: "bludgeoning" },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 7,
      discipline: 10,
    },
    lootTags: ["runestone"],
    tags: ["construct", "tank"],
  }),

  iron_guardian: makeEnemy({
    id: "enemy_iron_guardian",
    name: "Iron Guardian",
    faction: "construct",
    role: "boss",
    tier: "boss",
    pressureBand: "extreme",
    levelHint: 6,
    challengeHint: 7,
    portraitKey: "Enemy_Iron_Guardian",
    archetypeSkillSource: "Undead Knight",
    skillIds: getSkillsForEnemyArchetype("Undead Knight"),
    defenses: {
      ac: 19,
      hp: 82,
      speed: 25,
      resistances: ["physical", "poison", "psychic"],
      conditionImmunities: ["frightened", "poisoned", "stunned"],
    },
    actions: [
      {
        id: "crushing_grip",
        label: "Crushing Grip",
        kind: "melee",
        description: "Seize and crush a target in plated fists.",
        range: "melee",
        toHitBonus: 8,
        damage: { diceCount: 2, diceSides: 10, bonus: 4, type: "bludgeoning" },
        applyCondition: { condition: "restrained", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 8,
      discipline: 10,
      protectsAllies: false,
    },
    lootTags: ["guardian_core", "iron_relic"],
    tags: ["construct", "boss"],
  }),

  wolf: makeEnemy({
    id: "enemy_wolf",
    name: "Wolf",
    faction: "beast",
    role: "beast",
    tier: "common",
    pressureBand: "low",
    levelHint: 1,
    challengeHint: 1,
    portraitKey: "Enemy_Wolf",
    archetypeSkillSource: "Goblin Skirmisher",
    skillIds: getSkillsForEnemyArchetype("Goblin Skirmisher"),
    defenses: {
      ac: 13,
      hp: 11,
      speed: 40,
    },
    actions: [
      {
        id: "bite",
        label: "Bite",
        kind: "melee",
        description: "A fast snapping attack.",
        range: "melee",
        toHitBonus: 4,
        damage: { diceCount: 2, diceSides: 4, bonus: 2, type: "piercing" },
        usage: "at_will",
      },
      {
        id: "pack_drag",
        label: "Pack Drag",
        kind: "control",
        description: "Pull a target down into the pack's kill zone.",
        range: "melee",
        applyCondition: { condition: "restrained", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 7,
      discipline: 3,
      prefersWeakTargets: true,
    },
    lootTags: ["pelt"],
    tags: ["beast", "fast"],
  }),

  dire_wolf: makeEnemy({
    id: "enemy_dire_wolf",
    name: "Dire Wolf",
    faction: "beast",
    role: "beast",
    tier: "elite",
    pressureBand: "medium",
    levelHint: 3,
    challengeHint: 3,
    portraitKey: "Enemy_Dire_Wolf",
    archetypeSkillSource: "Orc Raider",
    skillIds: getSkillsForEnemyArchetype("Orc Raider"),
    defenses: {
      ac: 14,
      hp: 34,
      speed: 45,
    },
    actions: [
      {
        id: "maul",
        label: "Maul",
        kind: "melee",
        description: "A brutal pounce-and-tear attack.",
        range: "melee",
        toHitBonus: 5,
        damage: { diceCount: 2, diceSides: 6, bonus: 3, type: "piercing" },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 9,
      discipline: 4,
      prefersWeakTargets: true,
    },
    lootTags: ["dire_pelt"],
    tags: ["beast", "elite"],
  }),

  giant_spider: makeEnemy({
    id: "enemy_giant_spider",
    name: "Giant Spider",
    faction: "beast",
    role: "controller",
    tier: "elite",
    pressureBand: "medium",
    levelHint: 3,
    challengeHint: 3,
    portraitKey: "Enemy_Giant_Spider",
    archetypeSkillSource: "Goblin Skirmisher",
    skillIds: getSkillsForEnemyArchetype("Goblin Skirmisher"),
    defenses: {
      ac: 14,
      hp: 26,
      speed: 30,
      resistances: ["poison"],
    },
    actions: [
      {
        id: "poison_bite",
        label: "Poison Bite",
        kind: "melee",
        description: "Sink venom and panic into the target.",
        range: "melee",
        toHitBonus: 5,
        damage: { diceCount: 1, diceSides: 8, bonus: 2, type: "poison" },
        applyCondition: { condition: "poisoned", rounds: 1 },
        usage: "at_will",
      },
      {
        id: "web_trap",
        label: "Web Trap",
        kind: "control",
        description: "Pin a target in sticky silk.",
        range: "ranged",
        applyCondition: { condition: "restrained", rounds: 1 },
        usage: "per_turn",
      },
    ],
    behavior: {
      aggression: 6,
      discipline: 5,
      prefersWeakTargets: true,
      usesControlEarly: true,
    },
    lootTags: ["silk", "venom"],
    tags: ["beast", "poison"],
  }),

  hellhound: makeEnemy({
    id: "enemy_hellhound",
    name: "Hellhound",
    faction: "infernal",
    role: "beast",
    tier: "elite",
    pressureBand: "high",
    levelHint: 4,
    challengeHint: 4,
    portraitKey: "Enemy_Hellhound",
    groupLabel: "Neon Hounds",
    archetypeSkillSource: "Orc Raider",
    skillIds: getSkillsForEnemyArchetype("Orc Raider"),
    defenses: {
      ac: 15,
      hp: 39,
      speed: 45,
      resistances: ["fire"],
      vulnerabilities: ["cold"],
    },
    actions: [
      {
        id: "flame_bite",
        label: "Flame Bite",
        kind: "melee",
        description: "A scorching bite that leaves lingering fire.",
        range: "melee",
        toHitBonus: 6,
        damage: { diceCount: 2, diceSides: 6, bonus: 2, type: "fire" },
        applyCondition: { condition: "burning", rounds: 1 },
        usage: "at_will",
      },
    ],
    behavior: {
      aggression: 9,
      discipline: 5,
      prefersWeakTargets: true,
    },
    lootTags: ["ember_fang"],
    tags: ["infernal", "fire"],
  }),

  ancient_warden: makeEnemy({
    id: "enemy_ancient_warden",
    name: "Ancient Warden",
    faction: "ancient",
    role: "boss",
    tier: "boss",
    pressureBand: "extreme",
    levelHint: 7,
    challengeHint: 8,
    portraitKey: "Enemy_Ancient_Warden",
    archetypeSkillSource: "Undead Knight",
    skillIds: getSkillsForEnemyArchetype("Undead Knight"),
    defenses: {
      ac: 20,
      hp: 96,
      speed: 25,
      resistances: ["physical", "fire", "cold"],
      conditionImmunities: ["frightened", "stunned"],
    },
    actions: [
      {
        id: "wardens_hammer",
        label: "Warden's Hammer",
        kind: "melee",
        description: "A monumental strike from forgotten authority.",
        range: "melee",
        toHitBonus: 9,
        damage: { diceCount: 2, diceSides: 10, bonus: 5, type: "bludgeoning" },
        usage: "at_will",
      },
      {
        id: "seal_of_judgment",
        label: "Seal of Judgment",
        kind: "control",
        description: "Lock a zone down with ancient force.",
        range: "zone",
        applyCondition: { condition: "marked", rounds: 1 },
        usage: "per_combat",
      },
    ],
    behavior: {
      aggression: 7,
      discipline: 10,
      protectsAllies: false,
      usesControlEarly: true,
    },
    lootTags: ["warden_sigil", "ancient_key"],
    tags: ["ancient", "boss"],
  }),

  void_horror: makeEnemy({
    id: "enemy_void_horror",
    name: "Void Horror",
    faction: "ancient",
    role: "boss",
    tier: "boss",
    pressureBand: "extreme",
    levelHint: 8,
    challengeHint: 9,
    portraitKey: "Enemy_Void_Horror",
    archetypeSkillSource: "Dark Cultist",
    skillIds: getSkillsForEnemyArchetype("Dark Cultist"),
    defenses: {
      ac: 18,
      hp: 104,
      speed: 30,
      resistances: ["psychic", "shadow", "necrotic"],
      conditionImmunities: ["frightened"],
    },
    actions: [
      {
        id: "chaos_blast",
        label: "Chaos Blast",
        kind: "spell",
        description: "A rupture of unstable force from beyond the dungeon's logic.",
        range: "ranged",
        toHitBonus: 8,
        damage: { diceCount: 3, diceSides: 6, bonus: 3, type: "force" },
        usage: "at_will",
      },
      {
        id: "mind_warp",
        label: "Mind Warp",
        kind: "control",
        description: "Distort thought and perception across the whole line.",
        range: "zone",
        applyCondition: { condition: "frightened", rounds: 1 },
        usage: "per_combat",
      },
    ],
    behavior: {
      aggression: 8,
      discipline: 9,
      prefersBackline: true,
      usesControlEarly: true,
    },
    lootTags: ["void_shard"],
    tags: ["ancient", "aberrant", "boss"],
  }),
};

export const ENEMY_LIST: EnemyDefinition[] = Object.values(ENEMY_DATABASE);

export function getEnemyDefinitionById(id: string): EnemyDefinition | null {
  return ENEMY_LIST.find((e) => e.id === id) ?? null;
}

export function getEnemyDefinitionByName(name: string): EnemyDefinition | null {
  const key = String(name ?? "").trim().toLowerCase();
  return ENEMY_LIST.find((e) => e.name.toLowerCase() === key) ?? null;
}

export function getEnemiesByFaction(faction: EnemyFaction): EnemyDefinition[] {
  return ENEMY_LIST.filter((e) => e.faction === faction);
}

export function getEnemiesByPressureBand(band: EnemyPressureBand): EnemyDefinition[] {
  return ENEMY_LIST.filter((e) => e.pressureBand === band);
}

export function getEnemiesByTier(tier: EnemyTier): EnemyDefinition[] {
  return ENEMY_LIST.filter((e) => e.tier === tier);
}

export function getEnemiesForGroupLabel(groupLabel: string): EnemyDefinition[] {
  const key = String(groupLabel ?? "").trim().toLowerCase();
  return ENEMY_LIST.filter((e) => String(e.groupLabel ?? "").toLowerCase() === key);
}

export function getStarterDungeonEnemies(): EnemyDefinition[] {
  const names: EnemyArchetypeKey[] = [
    "Bandit Archer",
    "Bandit Warrior",
    "Bandit Rogue",
    "Goblin Skirmisher",
    "Goblin Archer",
    "Orc Raider",
    "Skeleton Warrior",
    "Zombie",
    "Wolf",
    "Giant Spider",
    "Cultist Acolyte",
    "Stone Golem",
  ];

  return names
    .map((name) => getEnemyDefinitionByName(name))
    .filter((e): e is EnemyDefinition => !!e);
}

export function getPressureBandForPartyLevel(avgPartyLevel: number): EnemyPressureBand {
  const n = Math.max(1, Math.trunc(Number(avgPartyLevel) || 1));
  if (n <= 2) return "low";
  if (n <= 4) return "medium";
  if (n <= 6) return "high";
  return "extreme";
}
