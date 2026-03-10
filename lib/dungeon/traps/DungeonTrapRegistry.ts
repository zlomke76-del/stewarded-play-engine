// lib/dungeon/traps/DungeonTrapRegistry.ts

// ------------------------------------------------------------
// Echoes of Fate — Dungeon Trap Registry
// ------------------------------------------------------------
// Purpose
// - Canonical definitions for dungeon traps
// - Used by DungeonGenerator and DungeonVisualResolver
// - Provides deterministic trap selection by room + theme
// ------------------------------------------------------------

export type DungeonTrapId =
  | "trap_spike_pit"
  | "trap_swinging_blades"
  | "trap_poison_darts"
  | "trap_falling_block"
  | "trap_crushing_walls"
  | "trap_gas_chamber";

export type DungeonTrapDanger =
  | "low"
  | "moderate"
  | "high"
  | "severe"
  | "deadly";

export type DungeonTrapRoomType =
  | "corridor"
  | "hall"
  | "passage"
  | "chokepoint"
  | "chamber"
  | "crypt"
  | "tomb"
  | "ossuary"
  | "shrine"
  | "ritual"
  | "treasure"
  | "vault"
  | "armory"
  | "prison"
  | "antechamber"
  | "stair";

export type DungeonTheme =
  | "abandoned_keep"
  | "forgotten_catacomb"
  | "cult_temple"
  | "dwarven_ruin"
  | "burial_tomb"
  | "generic_stone_dungeon";

export type DungeonTrapDefinition = {
  id: DungeonTrapId;
  name: string;
  danger: DungeonTrapDanger;
  assetPath: string;
  compatibleRoomTypes: DungeonTrapRoomType[];
  compatibleThemes: DungeonTheme[];
  generationWeight: number;
};

export const DUNGEON_TRAP_REGISTRY: Record<
  DungeonTrapId,
  DungeonTrapDefinition
> = {
  trap_spike_pit: {
    id: "trap_spike_pit",
    name: "Spike Pit",
    danger: "high",
    assetPath: "/assets/V3/Dungeon/Traps/spike_pit_01.png",
    compatibleRoomTypes: ["chamber", "antechamber", "crypt", "tomb"],
    compatibleThemes: [
      "forgotten_catacomb",
      "burial_tomb",
      "generic_stone_dungeon",
    ],
    generationWeight: 8,
  },

  trap_swinging_blades: {
    id: "trap_swinging_blades",
    name: "Swinging Blades",
    danger: "high",
    assetPath: "/assets/V3/Dungeon/Traps/swinging_corridor_01.png",
    compatibleRoomTypes: ["corridor", "hall", "chokepoint", "passage"],
    compatibleThemes: [
      "abandoned_keep",
      "dwarven_ruin",
      "generic_stone_dungeon",
    ],
    generationWeight: 10,
  },

  trap_poison_darts: {
    id: "trap_poison_darts",
    name: "Poison Dart Wall",
    danger: "moderate",
    assetPath: "/assets/V3/Dungeon/Traps/poison_darts_01.png",
    compatibleRoomTypes: ["treasure", "vault", "chamber"],
    compatibleThemes: [
      "forgotten_catacomb",
      "abandoned_keep",
      "generic_stone_dungeon",
    ],
    generationWeight: 9,
  },

  trap_falling_block: {
    id: "trap_falling_block",
    name: "Falling Stone Block",
    danger: "severe",
    assetPath: "/assets/V3/Dungeon/Traps/falling_stone_block_01.png",
    compatibleRoomTypes: ["corridor", "hall", "chokepoint"],
    compatibleThemes: [
      "dwarven_ruin",
      "abandoned_keep",
      "generic_stone_dungeon",
    ],
    generationWeight: 7,
  },

  trap_crushing_walls: {
    id: "trap_crushing_walls",
    name: "Crushing Walls",
    danger: "deadly",
    assetPath: "/assets/V3/Dungeon/Traps/crushing_walls_01.png",
    compatibleRoomTypes: ["corridor", "hall", "chokepoint"],
    compatibleThemes: [
      "dwarven_ruin",
      "abandoned_keep",
      "generic_stone_dungeon",
    ],
    generationWeight: 6,
  },

  trap_gas_chamber: {
    id: "trap_gas_chamber",
    name: "Gas Chamber",
    danger: "high",
    assetPath: "/assets/V3/Dungeon/Traps/gas_chamber_01.png",
    compatibleRoomTypes: ["shrine", "ritual", "crypt", "chamber"],
    compatibleThemes: [
      "cult_temple",
      "forgotten_catacomb",
      "generic_stone_dungeon",
    ],
    generationWeight: 8,
  },
};

export const ALL_DUNGEON_TRAPS = Object.freeze(
  Object.values(DUNGEON_TRAP_REGISTRY),
) as readonly DungeonTrapDefinition[];

export function getDungeonTrapById(
  trapId: DungeonTrapId | string | null | undefined,
): DungeonTrapDefinition | null {
  if (!trapId) return null;
  return (
    DUNGEON_TRAP_REGISTRY[trapId as DungeonTrapId] ??
    null
  );
}

export function getDungeonTrapAssetPath(
  trapId: DungeonTrapId | string | null | undefined,
): string | null {
  const trap = getDungeonTrapById(trapId);
  return trap?.assetPath ?? null;
}

export function listDungeonTrapIds(): DungeonTrapId[] {
  return ALL_DUNGEON_TRAPS.map((trap) => trap.id);
}

export function listDungeonTraps(): DungeonTrapDefinition[] {
  return [...ALL_DUNGEON_TRAPS];
}

export function getCompatibleDungeonTraps(args: {
  roomType?: DungeonTrapRoomType | null;
  theme?: DungeonTheme | null;
}): DungeonTrapDefinition[] {
  const { roomType, theme } = args;

  return ALL_DUNGEON_TRAPS.filter((trap) => {
    const roomOk = roomType
      ? trap.compatibleRoomTypes.includes(roomType)
      : true;

    const themeOk = theme
      ? trap.compatibleThemes.includes(theme)
      : true;

    return roomOk && themeOk;
  }).sort((a, b) => b.generationWeight - a.generationWeight);
}

export function chooseWeightedDungeonTrap(
  args: {
    roomType?: DungeonTrapRoomType | null;
    theme?: DungeonTheme | null;
  },
  rng: () => number = Math.random,
): DungeonTrapDefinition | null {
  const candidates = getCompatibleDungeonTraps(args);

  if (!candidates.length) return null;

  const totalWeight = candidates.reduce(
    (sum, trap) => sum + trap.generationWeight,
    0,
  );

  let roll = rng() * totalWeight;

  for (const trap of candidates) {
    roll -= trap.generationWeight;
    if (roll <= 0) {
      return trap;
    }
  }

  return candidates[0];
}
