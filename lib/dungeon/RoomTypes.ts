// lib/dungeon/RoomTypes.ts
// ------------------------------------------------------------
// Echoes of Fate — Room / Floor Taxonomy
// ------------------------------------------------------------
// Purpose:
// - Define the canonical dungeon room / floor vocabulary
// - Keep room semantics stable across generator, UI, discovery, combat,
//   and environment systems
// - Preserve separation between structure (room/floor taxonomy)
//   and runtime state
//
// Current design alignment:
// - Fixed 3-floor game structure:
//   Floor 0  = ruined_outpost
//   Floor -1 = deep_warrens
//   Floor -2 = forgotten_crypt
// - Middle floor supports darkness / faction pressure / route tension
// - Taxonomy remains backward-friendly with existing runtime types
// ------------------------------------------------------------

import type {
  EnemyEncounterTheme,
  EnemyEncounterDuty,
} from "@/lib/game/EnemyDatabase";

export type DungeonFloorTheme =
  | "ruined_outpost"
  | "deep_warrens"
  | "forgotten_crypt"
  // Legacy themes retained temporarily for compatibility with older content
  | "cult_temple"
  | "arcane_forge"
  | "wild_depths"
  | "ancient_vault";

export type RoomType =
  | "entrance"
  | "corridor"
  | "guard_post"
  | "shrine"
  | "armory"
  | "storage"
  | "beast_den"
  | "crypt"
  | "bone_pit"
  | "ritual_chamber"
  | "arcane_hall"
  | "sentinel_hall"
  | "relic_vault"
  | "treasure_room"
  | "boss_chamber"
  | "stairs_up"
  | "stairs_down"
  | "rest_site"
  // Expanded room vocabulary for current design
  | "barracks"
  | "breach_chamber"
  | "watchtower"
  | "flooded_chamber"
  | "ossuary"
  | "collapsed_passage"
  | "gate_hall"
  | "trial_chamber"
  | "relic_chamber"
  | "crypt_vault"
  | "forge_chamber";

export type RoomFeatureKind =
  | "door"
  | "locked_door"
  | "stairs"
  | "altar"
  | "cache"
  | "hazard"
  | "relic"
  | "boss"
  | "patrol_signs"
  | "warmth"
  | "torch_sconce"
  | "ritual_focus";

export type ConnectionType =
  | "corridor"
  | "door"
  | "locked_door"
  | "secret"
  | "stairs";

export type LightingTone =
  | "warm_torchlight"
  | "cold_blue"
  | "infernal_red"
  | "arcane_violet"
  | "sickly_green"
  | "ashen_gold"
  | "moonlit";

export type EnvironmentPressure =
  | "normal"
  | "dark"
  | "cold_dark";

export type RoomTaxonomy = {
  roomType: RoomType;
  label: string;
  category:
    | "entry"
    | "transit"
    | "combat"
    | "ritual"
    | "treasure"
    | "hazard"
    | "boss"
    | "transition"
    | "recovery";
  defaultFeatures: RoomFeatureKind[];
  preferredEncounterThemes: EnemyEncounterTheme[];
  preferredDuties?: EnemyEncounterDuty[];
  supportsCombat: boolean;
  supportsLoot: boolean;
  supportsShrine: boolean;
  supportsBoss: boolean;
  supportsStairs: boolean;
  supportsTorchRefill?: boolean;
  supportsWarmth?: boolean;
  supportsPuzzleCandidate?: boolean;
  supportsTrapCandidate?: boolean;
  supportsSafeRestCandidate?: boolean;
};

export type FloorThemeDefinition = {
  theme: DungeonFloorTheme;
  label: string;
  atmosphere: string;
  defaultLighting: LightingTone;
  environmentPressure: EnvironmentPressure;
  requiresTorchlight: boolean;
  requiresWarmth: boolean;
  primaryEncounterThemes: EnemyEncounterTheme[];
  secondaryEncounterThemes: EnemyEncounterTheme[];
  commonRoomTypes: RoomType[];
  rareRoomTypes: RoomType[];
  bossRoomType: Extract<RoomType, "boss_chamber">;
};

export const ROOM_TYPE_DEFINITIONS: Record<RoomType, RoomTaxonomy> = {
  entrance: {
    roomType: "entrance",
    label: "Entrance",
    category: "entry",
    defaultFeatures: [],
    preferredEncounterThemes: ["watch", "corridor"],
    preferredDuties: ["guard", "sentinel"],
    supportsCombat: false,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: false,
    supportsSafeRestCandidate: false,
  },

  corridor: {
    roomType: "corridor",
    label: "Corridor",
    category: "transit",
    defaultFeatures: [],
    preferredEncounterThemes: ["corridor", "watch"],
    preferredDuties: ["patrol", "guard", "sentinel"],
    supportsCombat: true,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  guard_post: {
    roomType: "guard_post",
    label: "Guard Post",
    category: "combat",
    defaultFeatures: ["door", "patrol_signs"],
    preferredEncounterThemes: ["watch", "corridor"],
    preferredDuties: ["guard", "captain", "sentinel", "artillery"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  shrine: {
    roomType: "shrine",
    label: "Shrine",
    category: "ritual",
    defaultFeatures: ["altar", "torch_sconce"],
    preferredEncounterThemes: ["shrine", "ritual", "ancient"],
    preferredDuties: ["shrine_keeper", "ritualist", "warden"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: true,
    supportsBoss: false,
    supportsStairs: false,
    supportsTorchRefill: true,
    supportsWarmth: true,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: true,
  },

  armory: {
    roomType: "armory",
    label: "Armory",
    category: "treasure",
    defaultFeatures: ["cache"],
    preferredEncounterThemes: ["storage", "watch", "vault"],
    preferredDuties: ["guard", "cache_guard"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  storage: {
    roomType: "storage",
    label: "Storage",
    category: "treasure",
    defaultFeatures: ["cache"],
    preferredEncounterThemes: ["storage", "corridor", "vault"],
    preferredDuties: ["cache_guard", "scavenger", "guard"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsTorchRefill: true,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  beast_den: {
    roomType: "beast_den",
    label: "Beast Den",
    category: "combat",
    defaultFeatures: ["hazard"],
    preferredEncounterThemes: ["wild", "ruin"],
    preferredDuties: ["hunter", "lurker"],
    supportsCombat: true,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  crypt: {
    roomType: "crypt",
    label: "Crypt",
    category: "combat",
    defaultFeatures: [],
    preferredEncounterThemes: ["crypt", "ancient"],
    preferredDuties: ["guard", "warden", "sentinel"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  bone_pit: {
    roomType: "bone_pit",
    label: "Bone Pit",
    category: "hazard",
    defaultFeatures: ["hazard"],
    preferredEncounterThemes: ["crypt", "wild"],
    preferredDuties: ["lurker", "hunter"],
    supportsCombat: true,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  ritual_chamber: {
    roomType: "ritual_chamber",
    label: "Ritual Chamber",
    category: "ritual",
    defaultFeatures: ["altar", "hazard", "ritual_focus"],
    preferredEncounterThemes: ["ritual", "shrine", "ancient"],
    preferredDuties: ["ritualist", "shrine_keeper", "warden"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: true,
    supportsBoss: false,
    supportsStairs: false,
    supportsWarmth: true,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  arcane_hall: {
    roomType: "arcane_hall",
    label: "Arcane Hall",
    category: "combat",
    defaultFeatures: ["hazard"],
    preferredEncounterThemes: ["arcane", "forge"],
    preferredDuties: ["sentinel", "warden"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  sentinel_hall: {
    roomType: "sentinel_hall",
    label: "Sentinel Hall",
    category: "combat",
    defaultFeatures: ["hazard"],
    preferredEncounterThemes: ["arcane", "watch", "vault"],
    preferredDuties: ["sentinel", "warden", "guard"],
    supportsCombat: true,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  relic_vault: {
    roomType: "relic_vault",
    label: "Relic Vault",
    category: "treasure",
    defaultFeatures: ["locked_door", "relic"],
    preferredEncounterThemes: ["vault", "ancient", "arcane"],
    preferredDuties: ["warden", "cache_guard", "shrine_keeper"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  treasure_room: {
    roomType: "treasure_room",
    label: "Treasure Room",
    category: "treasure",
    defaultFeatures: ["cache"],
    preferredEncounterThemes: ["vault", "storage"],
    preferredDuties: ["cache_guard", "guard"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  boss_chamber: {
    roomType: "boss_chamber",
    label: "Boss Chamber",
    category: "boss",
    defaultFeatures: ["boss"],
    preferredEncounterThemes: ["vault", "ancient", "ritual", "arcane"],
    preferredDuties: ["warden", "captain", "ritualist"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: true,
    supportsStairs: false,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  stairs_up: {
    roomType: "stairs_up",
    label: "Stairs Up",
    category: "transition",
    defaultFeatures: ["stairs"],
    preferredEncounterThemes: ["corridor", "watch"],
    preferredDuties: ["guard", "sentinel"],
    supportsCombat: false,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: true,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: false,
    supportsSafeRestCandidate: false,
  },

  stairs_down: {
    roomType: "stairs_down",
    label: "Stairs Down",
    category: "transition",
    defaultFeatures: ["stairs"],
    preferredEncounterThemes: ["corridor", "watch", "ancient"],
    preferredDuties: ["guard", "sentinel", "warden"],
    supportsCombat: false,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: true,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: false,
    supportsSafeRestCandidate: false,
  },

  rest_site: {
    roomType: "rest_site",
    label: "Rest Site",
    category: "recovery",
    defaultFeatures: ["warmth"],
    preferredEncounterThemes: ["ruin", "corridor"],
    preferredDuties: ["scavenger"],
    supportsCombat: false,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsTorchRefill: true,
    supportsWarmth: true,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: false,
    supportsSafeRestCandidate: true,
  },

  barracks: {
    roomType: "barracks",
    label: "Barracks",
    category: "combat",
    defaultFeatures: ["door", "cache"],
    preferredEncounterThemes: ["watch", "ruin", "corridor"],
    preferredDuties: ["guard", "captain", "patrol"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  breach_chamber: {
    roomType: "breach_chamber",
    label: "Breach Chamber",
    category: "combat",
    defaultFeatures: ["hazard", "patrol_signs"],
    preferredEncounterThemes: ["ruin", "watch", "wild"],
    preferredDuties: ["guard", "hunter", "lurker"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  watchtower: {
    roomType: "watchtower",
    label: "Watchtower",
    category: "transit",
    defaultFeatures: ["door", "patrol_signs"],
    preferredEncounterThemes: ["watch", "corridor"],
    preferredDuties: ["sentinel", "guard", "captain"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  flooded_chamber: {
    roomType: "flooded_chamber",
    label: "Flooded Chamber",
    category: "hazard",
    defaultFeatures: ["hazard"],
    preferredEncounterThemes: ["wild", "corridor", "ruin"],
    preferredDuties: ["lurker", "hunter", "patrol"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  ossuary: {
    roomType: "ossuary",
    label: "Ossuary",
    category: "ritual",
    defaultFeatures: ["hazard", "relic"],
    preferredEncounterThemes: ["crypt", "ritual", "ancient"],
    preferredDuties: ["warden", "ritualist", "lurker"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  collapsed_passage: {
    roomType: "collapsed_passage",
    label: "Collapsed Passage",
    category: "hazard",
    defaultFeatures: ["hazard"],
    preferredEncounterThemes: ["corridor", "ruin", "wild"],
    preferredDuties: ["lurker", "patrol"],
    supportsCombat: true,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: false,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  gate_hall: {
    roomType: "gate_hall",
    label: "Gate Hall",
    category: "transition",
    defaultFeatures: ["door", "locked_door"],
    preferredEncounterThemes: ["watch", "vault", "ancient"],
    preferredDuties: ["guard", "warden", "sentinel"],
    supportsCombat: true,
    supportsLoot: false,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  trial_chamber: {
    roomType: "trial_chamber",
    label: "Trial Chamber",
    category: "ritual",
    defaultFeatures: ["altar", "hazard", "ritual_focus"],
    preferredEncounterThemes: ["ritual", "ancient", "vault"],
    preferredDuties: ["ritualist", "warden", "sentinel"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: true,
    supportsBoss: false,
    supportsStairs: false,
    supportsWarmth: true,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  relic_chamber: {
    roomType: "relic_chamber",
    label: "Relic Chamber",
    category: "treasure",
    defaultFeatures: ["relic", "locked_door"],
    preferredEncounterThemes: ["vault", "ancient", "ritual"],
    preferredDuties: ["warden", "cache_guard", "ritualist"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  crypt_vault: {
    roomType: "crypt_vault",
    label: "Crypt Vault",
    category: "treasure",
    defaultFeatures: ["locked_door", "relic", "hazard"],
    preferredEncounterThemes: ["crypt", "vault", "ancient"],
    preferredDuties: ["warden", "sentinel", "guard"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },

  forge_chamber: {
    roomType: "forge_chamber",
    label: "Forge Chamber",
    category: "ritual",
    defaultFeatures: ["hazard", "warmth"],
    preferredEncounterThemes: ["forge", "arcane", "ruin"],
    preferredDuties: ["warden", "guard", "ritualist"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
    supportsTorchRefill: true,
    supportsWarmth: true,
    supportsPuzzleCandidate: true,
    supportsTrapCandidate: true,
    supportsSafeRestCandidate: false,
  },
};

export const FLOOR_THEME_DEFINITIONS: Record<DungeonFloorTheme, FloorThemeDefinition> = {
  ruined_outpost: {
    theme: "ruined_outpost",
    label: "Ruined Outpost",
    atmosphere:
      "Torchlit stone, broken fortifications, abandoned defense lines, and signs of scavenging after collapse.",
    defaultLighting: "warm_torchlight",
    environmentPressure: "normal",
    requiresTorchlight: false,
    requiresWarmth: false,
    primaryEncounterThemes: ["watch", "corridor", "storage", "ruin"],
    secondaryEncounterThemes: ["vault", "wild"],
    commonRoomTypes: [
      "entrance",
      "corridor",
      "guard_post",
      "barracks",
      "armory",
      "storage",
      "breach_chamber",
      "watchtower",
      "forge_chamber",
      "stairs_down",
    ],
    rareRoomTypes: [
      "shrine",
      "treasure_room",
      "rest_site",
      "collapsed_passage",
    ],
    bossRoomType: "boss_chamber",
  },

  deep_warrens: {
    theme: "deep_warrens",
    label: "Deep Warrens",
    atmosphere:
      "Dark contested passages, unstable halls, flooded pockets, ritual scars, and the feeling that the dungeon is awake.",
    defaultLighting: "sickly_green",
    environmentPressure: "dark",
    requiresTorchlight: true,
    requiresWarmth: false,
    primaryEncounterThemes: ["wild", "ruin", "corridor"],
    secondaryEncounterThemes: ["ritual", "arcane", "watch"],
    commonRoomTypes: [
      "corridor",
      "storage",
      "beast_den",
      "flooded_chamber",
      "ossuary",
      "collapsed_passage",
      "sentinel_hall",
      "gate_hall",
      "trial_chamber",
      "stairs_down",
      "stairs_up",
    ],
    rareRoomTypes: [
      "ritual_chamber",
      "relic_vault",
      "rest_site",
      "treasure_room",
      "shrine",
      "arcane_hall",
    ],
    bossRoomType: "boss_chamber",
  },

  forgotten_crypt: {
    theme: "forgotten_crypt",
    label: "Forgotten Crypt",
    atmosphere:
      "Cold burial halls, bone dust, bitter air, ancient vault pressure, and the oppressive stillness of remembered death.",
    defaultLighting: "cold_blue",
    environmentPressure: "cold_dark",
    requiresTorchlight: true,
    requiresWarmth: true,
    primaryEncounterThemes: ["crypt", "ancient", "corridor"],
    secondaryEncounterThemes: ["vault", "ritual"],
    commonRoomTypes: [
      "stairs_up",
      "crypt",
      "bone_pit",
      "ossuary",
      "crypt_vault",
      "relic_chamber",
    ],
    rareRoomTypes: [
      "relic_vault",
      "rest_site",
      "ritual_chamber",
      "shrine",
      "trial_chamber",
    ],
    bossRoomType: "boss_chamber",
  },

  // Legacy themes retained so older references do not break during transition.
  cult_temple: {
    theme: "cult_temple",
    label: "Cult Temple",
    atmosphere:
      "Infernal glow, ritual geometry, chanting echoes, and sacred violence.",
    defaultLighting: "infernal_red",
    environmentPressure: "dark",
    requiresTorchlight: true,
    requiresWarmth: false,
    primaryEncounterThemes: ["ritual", "shrine", "ancient"],
    secondaryEncounterThemes: ["vault", "corridor"],
    commonRoomTypes: ["corridor", "shrine", "ritual_chamber", "guard_post", "stairs_down"],
    rareRoomTypes: ["relic_vault", "treasure_room"],
    bossRoomType: "boss_chamber",
  },

  arcane_forge: {
    theme: "arcane_forge",
    label: "Arcane Forge",
    atmosphere:
      "Construct halls, humming wards, metallic echoes, and disciplined force.",
    defaultLighting: "arcane_violet",
    environmentPressure: "dark",
    requiresTorchlight: true,
    requiresWarmth: false,
    primaryEncounterThemes: ["arcane", "forge", "watch"],
    secondaryEncounterThemes: ["vault", "ancient"],
    commonRoomTypes: ["corridor", "arcane_hall", "sentinel_hall", "storage", "stairs_down"],
    rareRoomTypes: ["relic_vault", "rest_site", "shrine"],
    bossRoomType: "boss_chamber",
  },

  wild_depths: {
    theme: "wild_depths",
    label: "Wild Depths",
    atmosphere:
      "Overgrown routes, predatory silence, nesting grounds, and unstable passageways.",
    defaultLighting: "sickly_green",
    environmentPressure: "dark",
    requiresTorchlight: true,
    requiresWarmth: false,
    primaryEncounterThemes: ["wild", "ruin", "corridor"],
    secondaryEncounterThemes: ["storage"],
    commonRoomTypes: [
      "corridor",
      "beast_den",
      "bone_pit",
      "storage",
      "flooded_chamber",
      "stairs_down",
    ],
    rareRoomTypes: ["treasure_room", "rest_site", "collapsed_passage"],
    bossRoomType: "boss_chamber",
  },

  ancient_vault: {
    theme: "ancient_vault",
    label: "Ancient Vault",
    atmosphere:
      "Old authority, sealed relic architecture, and pressure that feels deliberate.",
    defaultLighting: "ashen_gold",
    environmentPressure: "dark",
    requiresTorchlight: true,
    requiresWarmth: false,
    primaryEncounterThemes: ["vault", "ancient", "arcane"],
    secondaryEncounterThemes: ["shrine", "corridor"],
    commonRoomTypes: ["corridor", "guard_post", "relic_vault", "sentinel_hall", "stairs_down"],
    rareRoomTypes: ["shrine", "treasure_room", "rest_site"],
    bossRoomType: "boss_chamber",
  },
};

export function getRoomTaxonomy(roomType: RoomType): RoomTaxonomy {
  return ROOM_TYPE_DEFINITIONS[roomType];
}

export function getFloorThemeDefinition(theme: DungeonFloorTheme): FloorThemeDefinition {
  return FLOOR_THEME_DEFINITIONS[theme];
}
