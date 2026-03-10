// lib/dungeon/DungeonGenerator.ts
// ------------------------------------------------------------
// Echoes of Fate — Deterministic Dungeon Generator
// ------------------------------------------------------------
// Purpose:
// - Generate a room + corridor + floor dungeon structure
// - Preserve deterministic output from a stable seed
// - Reuse existing enemy ecology themes from EnemyDatabase
//
// Notes:
// - This file generates structure only
// - It does not emit canon events
// - It does not mutate runtime state
// ------------------------------------------------------------

import type {
  DungeonFloorTheme,
  RoomType,
} from "@/lib/dungeon/RoomTypes";
import {
  FLOOR_THEME_DEFINITIONS,
  ROOM_TYPE_DEFINITIONS,
} from "@/lib/dungeon/RoomTypes";
import type {
  ConnectionId,
  DoorId,
  FloorId,
  RoomId,
} from "@/lib/dungeon/DungeonEvents";
import type {
  DungeonConnection,
  DungeonDefinition,
  DungeonEncounterSeed,
  DungeonFloor,
  DungeonRoom,
} from "@/lib/dungeon/FloorState";
import {
  chooseWeightedDungeonTrap,
  type DungeonTheme,
  type DungeonTrapDefinition,
  type DungeonTrapRoomType,
} from "@/lib/dungeon/traps/DungeonTrapRegistry";
import {
  getCacheGuardCandidatesForTheme,
  getEnemiesByEncounterTheme,
  getKeyCarrierCandidatesForTheme,
  getRelicCarrierCandidatesForTheme,
  getShrineGuardCandidatesForTheme,
} from "@/lib/game/EnemyDatabase";

type GeneratorArgs = {
  dungeonId?: string;
  seed: string;
  floorCount?: number;
};

function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng: () => number, min: number, max: number) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

function pickOne<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function pickManyUnique<T>(rng: () => number, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const out: T[] = [];

  while (pool.length > 0 && out.length < count) {
    const index = Math.floor(rng() * pool.length);
    out.push(pool.splice(index, 1)[0]);
  }

  return out;
}

function makeFloorId(floorIndex: number): FloorId {
  return `floor_${floorIndex + 1}`;
}

function makeRoomId(floorIndex: number, roomIndex: number): RoomId {
  return `floor_${floorIndex + 1}_room_${roomIndex + 1}`;
}

function makeConnectionId(floorIndex: number, connectionIndex: number): ConnectionId {
  return `floor_${floorIndex + 1}_connection_${connectionIndex + 1}`;
}

function makeDoorId(floorIndex: number, doorIndex: number): DoorId {
  return `floor_${floorIndex + 1}_door_${doorIndex + 1}`;
}

function chooseFloorThemes(rng: () => number, floorCount: number): DungeonFloorTheme[] {
  const progression: DungeonFloorTheme[] = [
    "ruined_outpost",
    "forgotten_crypt",
    "cult_temple",
    "arcane_forge",
    "ancient_vault",
  ];

  if (floorCount <= progression.length) {
    return progression.slice(0, floorCount);
  }

  const out = [...progression];
  while (out.length < floorCount) {
    out.push(pickOne(rng, progression.slice(2)));
  }
  return out;
}

function inferEncounterSeedForRoom(roomType: RoomType): DungeonEncounterSeed | null {
  const taxonomy = ROOM_TYPE_DEFINITIONS[roomType];
  const primaryTheme = taxonomy.preferredEncounterThemes[0];
  if (!primaryTheme || !taxonomy.supportsCombat) return null;

  const enemies = getEnemiesByEncounterTheme(primaryTheme);
  const keyCandidates = getKeyCarrierCandidatesForTheme(primaryTheme);
  const relicCandidates = getRelicCarrierCandidatesForTheme(primaryTheme);
  const cacheCandidates = getCacheGuardCandidatesForTheme(primaryTheme);
  const shrineCandidates = getShrineGuardCandidatesForTheme(primaryTheme);

  const preferredDuty = taxonomy.preferredDuties?.[0];

  return {
    theme: primaryTheme,
    duty: preferredDuty,
    enemyNames: enemies.slice(0, 3).map((e) => e.name),
    canCarryKey: keyCandidates.length > 0,
    canCarryRelic: relicCandidates.length > 0,
    canGuardCache: cacheCandidates.length > 0,
    canGuardShrine: shrineCandidates.length > 0,
  };
}

function defaultFeaturesForRoomType(roomType: RoomType) {
  const taxonomy = ROOM_TYPE_DEFINITIONS[roomType];
  return taxonomy.defaultFeatures.map((kind) => ({
    kind,
    discoveredByDefault: false,
    note: null,
  }));
}

function buildRoomLabel(roomType: RoomType): string {
  return ROOM_TYPE_DEFINITIONS[roomType].label;
}

function buildFloorLabel(theme: DungeonFloorTheme, floorIndex: number): string {
  return `${FLOOR_THEME_DEFINITIONS[theme].label} — Floor ${floorIndex + 1}`;
}

function buildCoreRoomPlanForTheme(
  rng: () => number,
  theme: DungeonFloorTheme,
  isFirstFloor: boolean,
  isLastFloor: boolean
): RoomType[] {
  const definition = FLOOR_THEME_DEFINITIONS[theme];
  const commonPool = definition.commonRoomTypes.filter(
    (t) => t !== "entrance" && t !== "stairs_down" && t !== "stairs_up"
  );

  const roomCount = randomInt(rng, 5, 7);
  const picked = pickManyUnique(rng, commonPool, Math.max(3, roomCount - 2));

  const plan: RoomType[] = [];

  if (isFirstFloor) {
    plan.push("entrance");
  } else {
    plan.push("stairs_up");
  }

  plan.push(...picked);

  if (!isLastFloor) {
    plan.push("stairs_down");
  } else {
    plan.push(definition.bossRoomType);
  }

  return plan;
}

function buildConnectionsForRoomPlan(
  floorIndex: number,
  roomIds: RoomId[],
  roomTypes: RoomType[]
): DungeonConnection[] {
  const connections: DungeonConnection[] = [];
  let connectionCounter = 0;
  let doorCounter = 0;

  for (let i = 0; i < roomIds.length - 1; i++) {
    const fromRoomId = roomIds[i];
    const toRoomId = roomIds[i + 1];
    const fromType = roomTypes[i];
    const toType = roomTypes[i + 1];

    const shouldLock =
      toType === "relic_vault" ||
      toType === "treasure_room" ||
      toType === "boss_chamber";

    const shouldUseDoor =
      toType !== "corridor" &&
      fromType !== "corridor" &&
      toType !== "stairs_down" &&
      toType !== "stairs_up";

    connectionCounter += 1;

    let type: DungeonConnection["type"] = "corridor";
    let doorId: DoorId | null = null;

    if (shouldLock) {
      type = "locked_door";
      doorCounter += 1;
      doorId = makeDoorId(floorIndex, doorCounter);
    } else if (shouldUseDoor) {
      type = "door";
      doorCounter += 1;
      doorId = makeDoorId(floorIndex, doorCounter);
    }

    connections.push({
      id: makeConnectionId(floorIndex, connectionCounter),
      fromRoomId,
      toRoomId,
      type,
      discoveredByDefault: i === 0,
      locked: type === "locked_door",
      doorId,
      note: null,
    });
  }

  return connections;
}

function mapFloorThemeToTrapTheme(theme: DungeonFloorTheme): DungeonTheme {
  switch (theme) {
    case "ruined_outpost":
      return "abandoned_keep";
    case "forgotten_crypt":
      return "forgotten_catacomb";
    case "cult_temple":
      return "cult_temple";
    case "arcane_forge":
      return "dwarven_ruin";
    case "ancient_vault":
      return "burial_tomb";
    default:
      return "generic_stone_dungeon";
  }
}

const ROOM_TYPE_TO_TRAP_ROOM_TYPE: Partial<Record<string, DungeonTrapRoomType>> = {
  entrance: "antechamber",
  corridor: "corridor",
  hall: "hall",
  passage: "passage",
  chokepoint: "chokepoint",
  chamber: "chamber",
  crypt: "crypt",
  tomb: "tomb",
  ossuary: "ossuary",
  shrine: "shrine",
  ritual_chamber: "ritual",
  treasure_room: "treasure",
  relic_vault: "vault",
  armory: "armory",
  prison: "prison",
  stairs_up: "stair",
  stairs_down: "stair",
};

function mapRoomTypeToTrapRoomType(roomType: RoomType): DungeonTrapRoomType | null {
  return ROOM_TYPE_TO_TRAP_ROOM_TYPE[roomType] ?? null;
}

function canRoomHostTrap(roomType: RoomType): boolean {
  switch (roomType) {
    case "entrance":
    case "stairs_up":
    case "stairs_down":
      return false;
    default:
      return true;
  }
}

function buildTrapStoryHint(trap: DungeonTrapDefinition): string {
  return [
    `trap:${trap.id}`,
    `name:${trap.name}`,
    `danger:${trap.danger}`,
    `asset:${trap.assetPath}`,
  ].join(" | ");
}

function chooseTrapForRoom(
  rng: () => number,
  roomType: RoomType,
  theme: DungeonFloorTheme
): DungeonTrapDefinition | null {
  if (!canRoomHostTrap(roomType)) return null;

  const mappedRoomType = mapRoomTypeToTrapRoomType(roomType);
  const mappedTheme = mapFloorThemeToTrapTheme(theme);

  if (!mappedRoomType) return null;

  const trapChance =
    mappedRoomType === "corridor" ||
    mappedRoomType === "hall" ||
    mappedRoomType === "chokepoint" ||
    mappedRoomType === "passage"
      ? 0.55
      : mappedRoomType === "shrine" || mappedRoomType === "ritual"
      ? 0.45
      : mappedRoomType === "treasure" || mappedRoomType === "vault"
      ? 0.5
      : 0.28;

  if (rng() > trapChance) return null;

  return chooseWeightedDungeonTrap(
    {
      roomType: mappedRoomType,
      theme: mappedTheme,
    },
    rng
  );
}

function buildRoomsForPlan(
  rng: () => number,
  floorId: FloorId,
  floorIndex: number,
  floorTheme: DungeonFloorTheme,
  roomPlan: RoomType[]
): DungeonRoom[] {
  return roomPlan.map((roomType, roomIndex) => {
    const roomId = makeRoomId(floorIndex, roomIndex);
    const encounterSeed = inferEncounterSeedForRoom(roomType);
    const trap = chooseTrapForRoom(rng, roomType, floorTheme);

    const lootHint =
      roomType === "relic_vault"
        ? "relic"
        : roomType === "treasure_room"
        ? "treasure"
        : roomType === "armory" || roomType === "storage"
        ? "supplies"
        : null;

    const features = defaultFeaturesForRoomType(roomType).map((feature) => {
      if (!trap) return feature;
      if (feature.kind !== "hazard") return feature;

      return {
        ...feature,
        note: trap.id,
      };
    });

    const storyHintParts: string[] = [];

    if (trap) {
      storyHintParts.push(buildTrapStoryHint(trap));
    }

    if (lootHint) {
      storyHintParts.push(`loot:${lootHint}`);
    }

    return {
      id: roomId,
      floorId,
      roomType,
      label: buildRoomLabel(roomType),
      discoverable: roomIndex !== 0,
      discoveredByDefault: roomIndex === 0,
      features,
      encounterSeed,
      lootHint,
      storyHint: storyHintParts.length > 0 ? storyHintParts.join(" || ") : null,
    };
  });
}

function buildFloor(
  rng: () => number,
  dungeonId: string,
  floorIndex: number,
  theme: DungeonFloorTheme,
  floorCount: number
): DungeonFloor {
  const floorId = makeFloorId(floorIndex);
  const roomPlan = buildCoreRoomPlanForTheme(
    rng,
    theme,
    floorIndex === 0,
    floorIndex === floorCount - 1
  );

  const rooms = buildRoomsForPlan(rng, floorId, floorIndex, theme, roomPlan);
  const roomIds = rooms.map((r) => r.id);
  const roomTypes = rooms.map((r) => r.roomType);
  const connections = buildConnectionsForRoomPlan(floorIndex, roomIds, roomTypes);

  const bossRoom =
    rooms.find((r) => r.roomType === "boss_chamber") ??
    rooms[rooms.length - 1];

  return {
    id: floorId,
    dungeonId,
    floorIndex,
    theme,
    label: buildFloorLabel(theme, floorIndex),
    startRoomId: rooms[0].id,
    bossRoomId: bossRoom.id,
    rooms,
    connections,
  };
}

export function generateDungeon(args: GeneratorArgs): DungeonDefinition {
  const seed = String(args.seed || "echoes-of-fate");
  const floorCount = Math.max(1, Math.min(6, Math.trunc(args.floorCount ?? 3)));
  const dungeonId = String(args.dungeonId || "echoes_dungeon");

  const rng = mulberry32(hash32(seed));
  const themes = chooseFloorThemes(rng, floorCount);

  const floors = themes.map((theme, floorIndex) =>
    buildFloor(rng, dungeonId, floorIndex, theme, floorCount)
  );

  return {
    dungeonId,
    seed,
    floors,
    startFloorId: floors[0].id,
    startRoomId: floors[0].startRoomId,
  };
}
