// lib/dungeon/RoomTypes.ts
// ------------------------------------------------------------
// Echoes of Fate — Room / Floor Taxonomy
// ------------------------------------------------------------
// Purpose:
// - Define the canonical dungeon room/floor vocabulary
// - Keep room semantics stable across generator, UI, discovery, and combat
// - Preserve separation between structure (room types) and runtime state
// ------------------------------------------------------------

import type {
  EnemyEncounterTheme,
  EnemyEncounterDuty,
} from "@/lib/game/EnemyDatabase";

export type DungeonFloorTheme =
  | "ruined_outpost"
  | "forgotten_crypt"
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
  | "rest_site";

export type RoomFeatureKind =
  | "door"
  | "locked_door"
  | "stairs"
  | "altar"
  | "cache"
  | "hazard"
  | "relic"
  | "boss"
  | "patrol_signs";

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
};

export type FloorThemeDefinition = {
  theme: DungeonFloorTheme;
  label: string;
  atmosphere: string;
  defaultLighting: LightingTone;
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
  },

  shrine: {
    roomType: "shrine",
    label: "Shrine",
    category: "ritual",
    defaultFeatures: ["altar"],
    preferredEncounterThemes: ["shrine", "ritual", "ancient"],
    preferredDuties: ["shrine_keeper", "ritualist", "warden"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: true,
    supportsBoss: false,
    supportsStairs: false,
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
  },

  ritual_chamber: {
    roomType: "ritual_chamber",
    label: "Ritual Chamber",
    category: "ritual",
    defaultFeatures: ["altar", "hazard"],
    preferredEncounterThemes: ["ritual", "shrine", "ancient"],
    preferredDuties: ["ritualist", "shrine_keeper", "warden"],
    supportsCombat: true,
    supportsLoot: true,
    supportsShrine: true,
    supportsBoss: false,
    supportsStairs: false,
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
  },

  rest_site: {
    roomType: "rest_site",
    label: "Rest Site",
    category: "recovery",
    defaultFeatures: [],
    preferredEncounterThemes: ["ruin", "corridor"],
    preferredDuties: ["scavenger"],
    supportsCombat: false,
    supportsLoot: true,
    supportsShrine: false,
    supportsBoss: false,
    supportsStairs: false,
  },
};

export const FLOOR_THEME_DEFINITIONS: Record<DungeonFloorTheme, FloorThemeDefinition> = {
  ruined_outpost: {
    theme: "ruined_outpost",
    label: "Ruined Outpost",
    atmosphere: "Torchlit stone, broken fortifications, signs of organized resistance and scavenging.",
    defaultLighting: "warm_torchlight",
    primaryEncounterThemes: ["watch", "corridor", "storage", "ruin"],
    secondaryEncounterThemes: ["vault", "wild"],
    commonRoomTypes: ["entrance", "corridor", "guard_post", "armory", "storage", "beast_den", "stairs_down"],
    rareRoomTypes: ["shrine", "treasure_room", "rest_site"],
    bossRoomType: "boss_chamber",
  },

  forgotten_crypt: {
    theme: "forgotten_crypt",
    label: "Forgotten Crypt",
    atmosphere: "Cold burial halls, bone dust, still air, and the pressure of the dead.",
    defaultLighting: "cold_blue",
    primaryEncounterThemes: ["crypt", "ancient", "corridor"],
    secondaryEncounterThemes: ["vault", "ritual"],
    commonRoomTypes: ["corridor", "crypt", "bone_pit", "storage", "shrine", "stairs_down"],
    rareRoomTypes: ["relic_vault", "rest_site"],
    bossRoomType: "boss_chamber",
  },

  cult_temple: {
    theme: "cult_temple",
    label: "Cult Temple",
    atmosphere: "Infernal glow, ritual geometry, chanting echoes, and sacred violence.",
    defaultLighting: "infernal_red",
    primaryEncounterThemes: ["ritual", "shrine", "ancient"],
    secondaryEncounterThemes: ["vault", "corridor"],
    commonRoomTypes: ["corridor", "shrine", "ritual_chamber", "guard_post", "stairs_down"],
    rareRoomTypes: ["relic_vault", "treasure_room"],
    bossRoomType: "boss_chamber",
  },

  arcane_forge: {
    theme: "arcane_forge",
    label: "Arcane Forge",
    atmosphere: "Construct halls, humming wards, metallic echoes, and disciplined force.",
    defaultLighting: "arcane_violet",
    primaryEncounterThemes: ["arcane", "forge", "watch"],
    secondaryEncounterThemes: ["vault", "ancient"],
    commonRoomTypes: ["corridor", "arcane_hall", "sentinel_hall", "storage", "stairs_down"],
    rareRoomTypes: ["relic_vault", "rest_site", "shrine"],
    bossRoomType: "boss_chamber",
  },

  wild_depths: {
    theme: "wild_depths",
    label: "Wild Depths",
    atmosphere: "Overgrown routes, predatory silence, nesting grounds, and unstable passageways.",
    defaultLighting: "sickly_green",
    primaryEncounterThemes: ["wild", "ruin", "corridor"],
    secondaryEncounterThemes: ["storage"],
    commonRoomTypes: ["corridor", "beast_den", "bone_pit", "storage", "stairs_down"],
    rareRoomTypes: ["treasure_room", "rest_site"],
    bossRoomType: "boss_chamber",
  },

  ancient_vault: {
    theme: "ancient_vault",
    label: "Ancient Vault",
    atmosphere: "Old authority, sealed relic architecture, and pressure that feels deliberate.",
    defaultLighting: "ashen_gold",
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
