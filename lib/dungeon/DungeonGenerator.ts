// lib/dungeon/DungeonGenerator.ts
// ------------------------------------------------------------
// Echoes of Fate — Deterministic Dungeon Generator
// ------------------------------------------------------------
// Purpose:
// - Generate a deterministic 3-floor room graph for Echoes of Fate
// - Support main path + branches instead of a linear chain
// - Randomize trap and puzzle placement per run while staying seed-stable
// - Write structured room/floor metadata directly into FloorState
//
// Notes:
// - No canon events are emitted here
// - No runtime state is mutated here
// ------------------------------------------------------------

import type {
  DungeonFloorTheme,
  EnvironmentPressure,
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
  DungeonRoomEnvironment,
  DungeonRoomFeature,
  FloorDepth,
  PuzzleId,
  RoomRouteRole,
  SetpieceId,
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

type EnvironmentState = "lit" | "dark" | "cold_dark";

type RoomNodePlan = {
  roomType: RoomType;
  routeRole: RoomRouteRole;
  branchDepth: number;
  anchorMainIndex?: number;
  forcedLabelHint?: string | null;
  setpieceId?: SetpieceId | null;
};

type FloorBlueprint = {
  theme: DungeonFloorTheme;
  depth: FloorDepth;
  environment: EnvironmentState;
  roomCountMin: number;
  roomCountMax: number;
  mainPathTypes: RoomType[];
  branchPool: RoomType[];
  signatureCandidates: Array<{
    roomType: RoomType;
    setpieceId: SetpieceId;
  }>;
  puzzlePool: PuzzleId[];
  puzzleCountMin: number;
  puzzleCountMax: number;
  trapCountMin: number;
  trapCountMax: number;
  loopChance: number;
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

function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeFloorId(floorIndex: number): FloorId {
  if (floorIndex === 0) return "floor_ground";
  if (floorIndex === 1) return "floor_depth_1";
  return "floor_crypt";
}

function makeRoomId(floorIndex: number, roomIndex: number): RoomId {
  return `${makeFloorId(floorIndex)}_room_${roomIndex + 1}`;
}

function makeConnectionId(floorIndex: number, connectionIndex: number): ConnectionId {
  return `${makeFloorId(floorIndex)}_connection_${connectionIndex + 1}`;
}

function makeDoorId(floorIndex: number, doorIndex: number): DoorId {
  return `${makeFloorId(floorIndex)}_door_${doorIndex + 1}`;
}

function fixedFloorBlueprints(): FloorBlueprint[] {
  return [
    {
      theme: "ruined_outpost",
      depth: 0,
      environment: "lit",
      roomCountMin: 10,
      roomCountMax: 14,
      mainPathTypes: [
        "entrance",
        "corridor",
        "guard_post",
        "storage",
        "armory",
        "shrine",
        "boss_chamber",
        "stairs_down",
      ],
      branchPool: [
        "corridor",
        "storage",
        "rest_site",
        "treasure_room",
        "guard_post",
        "armory",
        "beast_den",
        "barracks",
        "watchtower",
        "breach_chamber",
        "forge_chamber",
      ],
      signatureCandidates: [
        { roomType: "breach_chamber", setpieceId: "breach_chamber" },
        { roomType: "barracks", setpieceId: "last_barracks" },
        { roomType: "shrine", setpieceId: "failed_shrine" },
        { roomType: "watchtower", setpieceId: "watchtower_stairwell" },
      ],
      puzzlePool: [
        "whispering_anvil",
        "singing_chains",
        "mirror_of_regrets",
        "pressure_gauges",
      ],
      puzzleCountMin: 1,
      puzzleCountMax: 2,
      trapCountMin: 2,
      trapCountMax: 3,
      loopChance: 0.25,
    },
    {
      theme: "deep_warrens",
      depth: -1,
      environment: "dark",
      roomCountMin: 12,
      roomCountMax: 16,
      mainPathTypes: [
        "stairs_up",
        "corridor",
        "beast_den",
        "sentinel_hall",
        "trial_chamber",
        "arcane_hall",
        "boss_chamber",
        "stairs_down",
      ],
      branchPool: [
        "corridor",
        "storage",
        "treasure_room",
        "rest_site",
        "beast_den",
        "ritual_chamber",
        "sentinel_hall",
        "arcane_hall",
        "shrine",
        "relic_vault",
        "ossuary",
        "flooded_chamber",
        "collapsed_passage",
        "gate_hall",
      ],
      signatureCandidates: [
        { roomType: "trial_chamber", setpieceId: "oathbound_gate" },
        { roomType: "ossuary", setpieceId: "ossuary" },
        { roomType: "flooded_chamber", setpieceId: "flooded_chamber" },
        { roomType: "collapsed_passage", setpieceId: "collapsed_passage" },
        { roomType: "gate_hall", setpieceId: "pre_gate_hall" },
      ],
      puzzlePool: [
        "pressure_gauges",
        "mirror_of_regrets",
        "vault_of_unchosen_paths",
        "oathbound_gate",
        "singing_chains",
      ],
      puzzleCountMin: 2,
      puzzleCountMax: 3,
      trapCountMin: 3,
      trapCountMax: 5,
      loopChance: 0.4,
    },
    {
      theme: "forgotten_crypt",
      depth: -2,
      environment: "cold_dark",
      roomCountMin: 8,
      roomCountMax: 12,
      mainPathTypes: [
        "stairs_up",
        "crypt",
        "ossuary",
        "crypt_vault",
        "relic_chamber",
        "boss_chamber",
      ],
      branchPool: [
        "crypt",
        "bone_pit",
        "ritual_chamber",
        "relic_vault",
        "rest_site",
        "treasure_room",
        "shrine",
        "trial_chamber",
      ],
      signatureCandidates: [
        { roomType: "relic_chamber", setpieceId: "witness_antechamber" },
        { roomType: "trial_chamber", setpieceId: "crypt_rite_hall" },
        { roomType: "crypt_vault", setpieceId: "bone_vault" },
      ],
      puzzlePool: [
        "mirror_of_regrets",
        "vault_of_unchosen_paths",
        "pressure_gauges",
      ],
      puzzleCountMin: 1,
      puzzleCountMax: 2,
      trapCountMin: 2,
      trapCountMax: 4,
      loopChance: 0.15,
    },
  ];
}

function buildFloorLabel(theme: DungeonFloorTheme, depth: FloorDepth) {
  return `${FLOOR_THEME_DEFINITIONS[theme].label} — Floor ${depth}`;
}

function buildRoomLabel(roomType: RoomType): string {
  return ROOM_TYPE_DEFINITIONS[roomType].label;
}

function defaultFeaturesForRoomType(
  roomType: RoomType
): DungeonRoomFeature[] {
  const taxonomy = ROOM_TYPE_DEFINITIONS[roomType];
  return taxonomy.defaultFeatures.map(
    (kind): DungeonRoomFeature => ({
      kind,
      discoveredByDefault: false,
      note: null,
    })
  );
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

function mapFloorThemeToTrapTheme(theme: DungeonFloorTheme): DungeonTheme {
  switch (theme) {
    case "ruined_outpost":
      return "abandoned_keep";
    case "forgotten_crypt":
      return "forgotten_catacomb";
    case "deep_warrens":
      return "generic_stone_dungeon";
    case "cult_temple":
      return "cult_temple";
    case "arcane_forge":
      return "dwarven_ruin";
    case "ancient_vault":
      return "burial_tomb";
    case "wild_depths":
      return "generic_stone_dungeon";
    default:
      return "generic_stone_dungeon";
  }
}

const ROOM_TYPE_TO_TRAP_ROOM_TYPE: Partial<Record<RoomType, DungeonTrapRoomType>> = {
  entrance: "antechamber",
  corridor: "corridor",
  shrine: "shrine",
  guard_post: "chokepoint",
  armory: "armory",
  storage: "chamber",
  beast_den: "chamber",
  crypt: "crypt",
  bone_pit: "crypt",
  ritual_chamber: "ritual",
  arcane_hall: "hall",
  sentinel_hall: "hall",
  relic_vault: "vault",
  treasure_room: "treasure",
  boss_chamber: "chamber",
  stairs_up: "stair",
  stairs_down: "stair",
  rest_site: "chamber",
  barracks: "chamber",
  breach_chamber: "hall",
  watchtower: "hall",
  flooded_chamber: "chamber",
  ossuary: "crypt",
  collapsed_passage: "passage",
  gate_hall: "hall",
  trial_chamber: "ritual",
  relic_chamber: "vault",
  crypt_vault: "vault",
  forge_chamber: "chamber",
};

function mapRoomTypeToTrapRoomType(roomType: RoomType): DungeonTrapRoomType | null {
  return ROOM_TYPE_TO_TRAP_ROOM_TYPE[roomType] ?? null;
}

function canRoomHostTrap(roomType: RoomType): boolean {
  switch (roomType) {
    case "entrance":
    case "stairs_up":
    case "stairs_down":
    case "rest_site":
      return false;
    default:
      return true;
  }
}

function chooseTrapForRoom(
  rng: () => number,
  roomType: RoomType,
  theme: DungeonFloorTheme
): DungeonTrapDefinition | null {
  if (!canRoomHostTrap(roomType)) return null;
  const trapRoomType = mapRoomTypeToTrapRoomType(roomType);
  if (!trapRoomType) return null;

  return chooseWeightedDungeonTrap(
    {
      roomType: trapRoomType,
      theme: mapFloorThemeToTrapTheme(theme),
    },
    rng
  );
}

function buildStoryHintParts(args: {
  depth: FloorDepth;
  theme: DungeonFloorTheme;
  routeRole: RoomRouteRole;
  branchDepth: number;
  environment: EnvironmentState;
  puzzleId?: PuzzleId | null;
  trapId?: string | null;
  setpieceId?: SetpieceId | null;
  lootHint?: DungeonRoom["lootHint"];
  refuge?: boolean;
  fireSource?: boolean;
}) {
  const parts = [
    `floor_depth:${args.depth}`,
    `theme:${args.theme}`,
    `route:${args.routeRole}`,
    `branch_depth:${args.branchDepth}`,
    `env:${args.environment}`,
  ];

  if (args.environment === "dark") {
    parts.push("requires:torch");
  }

  if (args.environment === "cold_dark") {
    parts.push("requires:torch");
    parts.push("requires:warmth");
  }

  if (args.puzzleId) parts.push(`puzzle:${args.puzzleId}`);
  if (args.trapId) parts.push(`trap:${args.trapId}`);
  if (args.setpieceId) parts.push(`setpiece:${args.setpieceId}`);
  if (args.lootHint) parts.push(`loot:${args.lootHint}`);
  if (args.refuge) parts.push("refuge:true");
  if (args.fireSource) parts.push("fire_source:true");

  return parts.join(" || ");
}

function buildMainPathPlans(blueprint: FloorBlueprint): RoomNodePlan[] {
  return blueprint.mainPathTypes.map((roomType, index, all) => {
    let routeRole: RoomRouteRole = "main_path";
    const isLast = index === all.length - 1;

    if (roomType === "boss_chamber") {
      routeRole = "boss_approach";
    } else if (roomType === "stairs_down") {
      routeRole = "stairs_approach";
    } else if (isLast) {
      routeRole = "boss_approach";
    }

    return {
      roomType,
      routeRole,
      branchDepth: 0,
    };
  });
}

function buildBranchPlans(
  rng: () => number,
  blueprint: FloorBlueprint,
  targetTotalRooms: number,
  mainPathCount: number
): RoomNodePlan[] {
  const targetBranchRooms = Math.max(0, targetTotalRooms - mainPathCount);
  if (targetBranchRooms <= 0) return [];

  const plans: RoomNodePlan[] = [];
  const mainAnchorMin = 1;
  const mainAnchorMax = Math.max(1, mainPathCount - 2);

  while (plans.length < targetBranchRooms) {
    const remaining = targetBranchRooms - plans.length;
    const branchLength = remaining >= 3 && rng() < 0.45 ? 2 : 1;
    const anchorMainIndex = randomInt(rng, mainAnchorMin, mainAnchorMax);

    for (let i = 0; i < branchLength && plans.length < targetBranchRooms; i++) {
      const roomType = pickOne(rng, blueprint.branchPool);
      plans.push({
        roomType,
        routeRole:
          i === branchLength - 1
            ? rng() < 0.55
              ? "dead_end"
              : "resource"
            : "branch",
        branchDepth: i + 1,
        anchorMainIndex,
      });
    }
  }

  return plans;
}

function attachSignature(
  rng: () => number,
  blueprint: FloorBlueprint,
  roomPlans: RoomNodePlan[]
) {
  const candidates = shuffle(rng, blueprint.signatureCandidates);

  for (const candidate of candidates) {
    const compatible = roomPlans.filter(
      (plan) =>
        plan.roomType === candidate.roomType &&
        plan.routeRole !== "boss_approach" &&
        plan.routeRole !== "stairs_approach"
    );

    if (!compatible.length) continue;

    const chosen = pickOne(rng, compatible);
    chosen.routeRole = "signature";
    chosen.setpieceId = candidate.setpieceId;
    return;
  }
}

function buildFloorPlans(
  rng: () => number,
  blueprint: FloorBlueprint
): RoomNodePlan[] {
  const targetRooms = randomInt(rng, blueprint.roomCountMin, blueprint.roomCountMax);
  const mainPlans = buildMainPathPlans(blueprint);
  const branchPlans = buildBranchPlans(rng, blueprint, targetRooms, mainPlans.length);
  const allPlans = [...mainPlans, ...branchPlans];

  attachSignature(rng, blueprint, allPlans);

  return allPlans;
}

function compatibleRoomTypesForPuzzle(puzzleId: PuzzleId): RoomType[] {
  switch (puzzleId) {
    case "whispering_anvil":
      return ["armory", "forge_chamber", "storage"];
    case "singing_chains":
      return ["corridor", "ritual_chamber", "sentinel_hall", "gate_hall"];
    case "mirror_of_regrets":
      return ["shrine", "rest_site", "ritual_chamber", "trial_chamber"];
    case "pressure_gauges":
      return ["corridor", "guard_post", "sentinel_hall", "gate_hall"];
    case "vault_of_unchosen_paths":
      return ["relic_vault", "treasure_room", "trial_chamber", "relic_chamber"];
    case "oathbound_gate":
      return ["trial_chamber", "gate_hall"];
    default:
      return [];
  }
}

function selectPuzzlesForFloor(
  rng: () => number,
  blueprint: FloorBlueprint
): PuzzleId[] {
  const count = clamp(
    randomInt(rng, blueprint.puzzleCountMin, blueprint.puzzleCountMax),
    0,
    blueprint.puzzlePool.length
  );

  const picked = pickManyUnique(rng, blueprint.puzzlePool, count);

  if (
    blueprint.depth === -1 &&
    !picked.includes("oathbound_gate") &&
    rng() < 0.6
  ) {
    const replaceIndex = picked.length ? randomInt(rng, 0, picked.length - 1) : -1;
    if (replaceIndex >= 0) {
      picked[replaceIndex] = "oathbound_gate";
    } else {
      picked.push("oathbound_gate");
    }
  }

  return Array.from(new Set(picked));
}

function placePuzzlesOnPlans(
  rng: () => number,
  blueprint: FloorBlueprint,
  roomPlans: RoomNodePlan[]
): Map<number, PuzzleId> {
  const selectedPuzzles = selectPuzzlesForFloor(rng, blueprint);
  const assignments = new Map<number, PuzzleId>();
  const usedRoomIndexes = new Set<number>();

  for (const puzzleId of selectedPuzzles) {
    const compatibleTypes = compatibleRoomTypesForPuzzle(puzzleId);

    const compatibleIndexes = roomPlans
      .map((plan, index) => ({ plan, index }))
      .filter(({ plan, index }) => {
        if (usedRoomIndexes.has(index)) return false;
        if (!compatibleTypes.includes(plan.roomType)) return false;
        if (plan.routeRole === "boss_approach") return false;
        if (plan.routeRole === "stairs_approach") return false;
        return true;
      })
      .map(({ index }) => index);

    if (!compatibleIndexes.length) continue;

    const chosenIndex = pickOne(rng, compatibleIndexes);
    usedRoomIndexes.add(chosenIndex);
    assignments.set(chosenIndex, puzzleId);
    roomPlans[chosenIndex].routeRole = "puzzle";
  }

  return assignments;
}

function chooseTrapRoomIndexes(
  rng: () => number,
  blueprint: FloorBlueprint,
  roomPlans: RoomNodePlan[],
  puzzleAssignments: Map<number, PuzzleId>
): number[] {
  const targetCount = clamp(
    randomInt(rng, blueprint.trapCountMin, blueprint.trapCountMax),
    0,
    roomPlans.length
  );

  const weightedCandidates = roomPlans
    .map((plan, index) => ({ plan, index }))
    .filter(({ plan, index }) => {
      if (puzzleAssignments.has(index)) return false;
      if (!canRoomHostTrap(plan.roomType)) return false;
      return true;
    })
    .map(({ plan, index }) => {
      let weight = 1;
      if (plan.routeRole === "stairs_approach") weight += 2;
      if (plan.routeRole === "dead_end") weight += 1;
      if (
        plan.roomType === "corridor" ||
        plan.roomType === "sentinel_hall" ||
        plan.roomType === "gate_hall"
      ) {
        weight += 2;
      }
      if (
        plan.roomType === "relic_vault" ||
        plan.roomType === "treasure_room" ||
        plan.roomType === "relic_chamber" ||
        plan.roomType === "crypt_vault"
      ) {
        weight += 2;
      }
      if (plan.roomType === "ritual_chamber" || plan.roomType === "trial_chamber") {
        weight += 1;
      }
      return { index, weight };
    });

  const chosen: number[] = [];
  const pool = [...weightedCandidates];

  while (pool.length > 0 && chosen.length < targetCount) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng() * total;
    let pickedIndex = 0;

    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].weight;
      if (roll <= 0) {
        pickedIndex = i;
        break;
      }
    }

    const [picked] = pool.splice(pickedIndex, 1);
    chosen.push(picked.index);
  }

  return chosen;
}

function buildConnectionType(
  fromType: RoomType,
  toType: RoomType,
  isBranch: boolean,
  shouldLock: boolean
): DungeonConnection["type"] {
  if (toType === "stairs_down" || toType === "stairs_up") return "stairs";
  if (shouldLock) return "locked_door";
  if (
    isBranch &&
    (toType === "relic_vault" ||
      toType === "treasure_room" ||
      toType === "relic_chamber" ||
      toType === "crypt_vault")
  ) {
    return "door";
  }
  if (fromType === "corridor" && toType === "corridor") return "corridor";
  return "door";
}

function buildGraphConnections(args: {
  floorIndex: number;
  roomPlans: RoomNodePlan[];
  roomIds: RoomId[];
  loopChance: number;
  rng: () => number;
}): DungeonConnection[] {
  const { floorIndex, roomPlans, roomIds, loopChance, rng } = args;

  const connections: DungeonConnection[] = [];
  let connectionCounter = 0;
  let doorCounter = 0;

  const mainPathIndexes = roomPlans
    .map((plan, index) => ({ plan, index }))
    .filter(({ plan }) => plan.branchDepth === 0)
    .map(({ index }) => index);

  for (let i = 0; i < mainPathIndexes.length - 1; i++) {
    const fromIndex = mainPathIndexes[i];
    const toIndex = mainPathIndexes[i + 1];
    const fromType = roomPlans[fromIndex].roomType;
    const toType = roomPlans[toIndex].roomType;

    const shouldLock =
      toType === "relic_vault" ||
      toType === "relic_chamber" ||
      toType === "crypt_vault" ||
      (toType === "treasure_room" && rng() < 0.35);

    const type = buildConnectionType(fromType, toType, false, shouldLock);
    let doorId: DoorId | null = null;

    if (type === "door" || type === "locked_door") {
      doorCounter += 1;
      doorId = makeDoorId(floorIndex, doorCounter);
    }

    connectionCounter += 1;
    connections.push({
      id: makeConnectionId(floorIndex, connectionCounter),
      fromRoomId: roomIds[fromIndex],
      toRoomId: roomIds[toIndex],
      type,
      discoveredByDefault: i === 0,
      locked: type === "locked_door",
      doorId,
      note:
        type === "stairs"
          ? toType === "stairs_up"
            ? "up"
            : "down"
          : null,
    });
  }

  const branchGroups = new Map<number, number[]>();

  roomPlans.forEach((plan, index) => {
    if (plan.branchDepth <= 0 || plan.anchorMainIndex == null) return;
    const existing = branchGroups.get(plan.anchorMainIndex) ?? [];
    existing.push(index);
    branchGroups.set(plan.anchorMainIndex, existing);
  });

  for (const [anchorMainIndex, branchIndexes] of branchGroups.entries()) {
    const sorted = [...branchIndexes].sort(
      (a, b) => roomPlans[a].branchDepth - roomPlans[b].branchDepth
    );

    let prevIndex = anchorMainIndex;

    for (const currentIndex of sorted) {
      const fromType = roomPlans[prevIndex].roomType;
      const toType = roomPlans[currentIndex].roomType;
      const shouldLock =
        toType === "relic_vault" ||
        toType === "relic_chamber" ||
        toType === "crypt_vault";

      const type = buildConnectionType(fromType, toType, true, shouldLock);

      let doorId: DoorId | null = null;
      if (type === "door" || type === "locked_door") {
        doorCounter += 1;
        doorId = makeDoorId(floorIndex, doorCounter);
      }

      connectionCounter += 1;
      connections.push({
        id: makeConnectionId(floorIndex, connectionCounter),
        fromRoomId: roomIds[prevIndex],
        toRoomId: roomIds[currentIndex],
        type,
        discoveredByDefault: false,
        locked: type === "locked_door",
        doorId,
        note: null,
      });

      prevIndex = currentIndex;
    }
  }

  if (rng() < loopChance && mainPathIndexes.length >= 5) {
    const fromMainIndex = pickOne(
      rng,
      mainPathIndexes.slice(1, Math.max(2, mainPathIndexes.length - 3))
    );
    const laterCandidates = mainPathIndexes.filter((idx) => idx > fromMainIndex + 1);

    if (laterCandidates.length) {
      const toMainIndex = pickOne(rng, laterCandidates);
      connectionCounter += 1;
      connections.push({
        id: makeConnectionId(floorIndex, connectionCounter),
        fromRoomId: roomIds[fromMainIndex],
        toRoomId: roomIds[toMainIndex],
        type: rng() < 0.5 ? "secret" : "door",
        discoveredByDefault: false,
        locked: false,
        doorId: null,
        note: "loop",
      });
    }
  }

  return connections;
}

function mapEnvironmentStateToPressure(
  environment: EnvironmentState
): EnvironmentPressure {
  switch (environment) {
    case "lit":
      return "normal";
    case "dark":
      return "dark";
    case "cold_dark":
      return "cold_dark";
  }
}

function buildEnvironmentState(
  blueprint: FloorBlueprint,
  roomType: RoomType
): DungeonRoomEnvironment {
  const taxonomy = ROOM_TYPE_DEFINITIONS[roomType];
  const refuge =
    taxonomy.supportsSafeRestCandidate === true ||
    roomType === "shrine" ||
    roomType === "rest_site";

  const hasFireSource =
    taxonomy.supportsWarmth === true ||
    roomType === "forge_chamber" ||
    roomType === "rest_site" ||
    roomType === "ritual_chamber" ||
    roomType === "trial_chamber";

  return {
    pressure: mapEnvironmentStateToPressure(blueprint.environment),
    requiresTorchlight: blueprint.environment !== "lit",
    requiresWarmth: blueprint.environment === "cold_dark",
    isRefuge: refuge,
    hasFireSource,
  };
}

function buildForcedLabelHint(plan: RoomNodePlan): string | null {
  if (plan.forcedLabelHint) return plan.forcedLabelHint;
  switch (plan.setpieceId) {
    case "breach_chamber":
      return "Breach Chamber";
    case "last_barracks":
      return "Last Barracks";
    case "failed_shrine":
      return "Fallen Shrine";
    case "watchtower_stairwell":
      return "Watchtower Stairwell";
    case "oathbound_gate":
      return "Oathbound Gate";
    case "ossuary":
      return "Ossuary";
    case "flooded_chamber":
      return "Flooded Chamber";
    case "collapsed_passage":
      return "Collapsed Passage";
    case "pre_gate_hall":
      return "Pre-Gate Hall";
    case "witness_antechamber":
      return "Witness Antechamber";
    case "crypt_rite_hall":
      return "Ritual Vault";
    case "bone_vault":
      return "Bone Vault";
    default:
      return null;
  }
}

function buildLootHintForRoom(roomType: RoomType): DungeonRoom["lootHint"] {
  if (
    roomType === "relic_vault" ||
    roomType === "relic_chamber" ||
    roomType === "crypt_vault"
  ) {
    return "relic";
  }
  if (roomType === "treasure_room") return "treasure";
  if (roomType === "armory" || roomType === "storage" || roomType === "forge_chamber") {
    return "supplies";
  }
  if (roomType === "rest_site" || roomType === "crypt") return "cache";
  return null;
}

function buildRoomsForPlans(args: {
  rng: () => number;
  floorId: FloorId;
  blueprint: FloorBlueprint;
  roomPlans: RoomNodePlan[];
  puzzleAssignments: Map<number, PuzzleId>;
  trapIndexes: Set<number>;
  floorIndex: number;
}): DungeonRoom[] {
  const { rng, floorId, blueprint, roomPlans, puzzleAssignments, trapIndexes, floorIndex } = args;

  return roomPlans.map((plan, roomIndex) => {
    const roomId = makeRoomId(floorIndex, roomIndex);
    const encounterSeed = inferEncounterSeedForRoom(plan.roomType);
    const lootHint = buildLootHintForRoom(plan.roomType);
    const environment = buildEnvironmentState(blueprint, plan.roomType);
    const trap = trapIndexes.has(roomIndex)
      ? chooseTrapForRoom(rng, plan.roomType, blueprint.theme)
      : null;

    const puzzleId = puzzleAssignments.get(roomIndex) ?? null;
    const trapId = trap?.id ?? null;

    const features = defaultFeaturesForRoomType(plan.roomType);

    if (puzzleId) {
      const existingHazard = features.find((f) => f.kind === "hazard");
      if (!existingHazard) {
        features.push({
          kind: "hazard",
          discoveredByDefault: false,
          note: `puzzle:${puzzleId}`,
        });
      }
    }

    if (trapId) {
      const hazardIndex = features.findIndex((f) => f.kind === "hazard");
      if (hazardIndex >= 0) {
        features[hazardIndex] = {
          ...features[hazardIndex],
          note: trapId,
        };
      } else {
        features.push({
          kind: "hazard",
          discoveredByDefault: false,
          note: trapId,
        });
      }
    }

    const forcedLabel = buildForcedLabelHint(plan);
    const roomTaxonomy = ROOM_TYPE_DEFINITIONS[plan.roomType];

    return {
      id: roomId,
      floorId,
      roomType: plan.roomType,
      label: forcedLabel ?? buildRoomLabel(plan.roomType),
      discoverable: roomIndex !== 0,
      discoveredByDefault: roomIndex === 0,
      features,
      encounterSeed,
      lootHint,
      storyHint: buildStoryHintParts({
        depth: blueprint.depth,
        theme: blueprint.theme,
        routeRole: plan.routeRole,
        branchDepth: plan.branchDepth,
        environment: blueprint.environment,
        puzzleId,
        trapId,
        setpieceId: plan.setpieceId ?? null,
        lootHint,
        refuge: environment.isRefuge,
        fireSource: environment.hasFireSource,
      }),
      routeRole: plan.routeRole,
      branchDepth: plan.branchDepth,
      isMainPath: plan.branchDepth === 0,
      isBranch: plan.branchDepth > 0,
      isDeadEnd: plan.routeRole === "dead_end",
      environment,
      puzzleId,
      trapId,
      isSignature: !!plan.setpieceId || plan.routeRole === "signature",
      setpieceId: plan.setpieceId ?? null,
      supportsTorchRefill: roomTaxonomy.supportsTorchRefill === true,
      supportsWarmth: roomTaxonomy.supportsWarmth === true,
    };
  });
}

function buildFloor(
  rng: () => number,
  dungeonId: string,
  floorIndex: number,
  blueprint: FloorBlueprint
): DungeonFloor {
  const floorId = makeFloorId(floorIndex);
  const floorDefinition = FLOOR_THEME_DEFINITIONS[blueprint.theme];

  const roomPlans = buildFloorPlans(rng, blueprint);
  const puzzleAssignments = placePuzzlesOnPlans(rng, blueprint, roomPlans);
  const trapIndexes = new Set(
    chooseTrapRoomIndexes(rng, blueprint, roomPlans, puzzleAssignments)
  );

  const rooms = buildRoomsForPlans({
    rng,
    floorId,
    blueprint,
    roomPlans,
    puzzleAssignments,
    trapIndexes,
    floorIndex,
  });

  const roomIds = rooms.map((r) => r.id);
  const connections = buildGraphConnections({
    floorIndex,
    roomPlans,
    roomIds,
    loopChance: blueprint.loopChance,
    rng,
  });

  const bossRoom =
    rooms.find((room) => room.roomType === "boss_chamber") ??
    rooms[rooms.length - 1];

  return {
    id: floorId,
    dungeonId,
    floorIndex,
    depth: blueprint.depth,
    theme: blueprint.theme,
    label: buildFloorLabel(blueprint.theme, blueprint.depth),
    environmentPressure: floorDefinition.environmentPressure,
    requiresTorchlight: floorDefinition.requiresTorchlight,
    requiresWarmth: floorDefinition.requiresWarmth,
    startRoomId: rooms[0].id,
    bossRoomId: bossRoom.id,
    rooms,
    connections,
  };
}

export function generateDungeon(args: GeneratorArgs): DungeonDefinition {
  const seed = String(args.seed || "echoes-of-fate");
  const dungeonId = String(args.dungeonId || "echoes_dungeon");

  const blueprints = fixedFloorBlueprints();
  const rng = mulberry32(hash32(seed));

  const floors = blueprints.map((blueprint, floorIndex) =>
    buildFloor(rng, dungeonId, floorIndex, blueprint)
  );

  return {
    dungeonId,
    seed,
    floors,
    startFloorId: floors[0].id,
    startRoomId: floors[0].startRoomId,
  };
}
