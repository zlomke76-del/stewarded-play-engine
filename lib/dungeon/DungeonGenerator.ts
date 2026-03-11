// lib/dungeon/DungeonGenerator.ts
// ------------------------------------------------------------
// Echoes of Fate — Deterministic Dungeon Generator
// ------------------------------------------------------------
// Purpose:
// - Generate a deterministic 3-floor room graph for Echoes of Fate
// - Support main path + branches instead of a linear chain
// - Randomize trap and puzzle placement per run while staying seed-stable
// - Encode floor identity / environment hints for runtime + narration
//
// Current compatibility notes:
// - This file works within the existing RoomTypes / FloorState types
// - Richer metadata is encoded into storyHint until dedicated fields exist
// - No canon events are emitted here
// - No runtime state is mutated here
// ------------------------------------------------------------

import type { DungeonFloorTheme, RoomType } from "@/lib/dungeon/RoomTypes";
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
  DungeonRoomFeature,
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

type PuzzleId =
  | "whispering_anvil"
  | "singing_chains"
  | "mirror_of_regrets"
  | "pressure_gauges"
  | "vault_of_unchosen_paths"
  | "oathbound_gate";

type RoomRole =
  | "main_path"
  | "branch"
  | "dead_end"
  | "boss_approach"
  | "stairs_approach"
  | "signature"
  | "resource"
  | "puzzle";

type RoomNodePlan = {
  roomType: RoomType;
  routeRole: RoomRole;
  branchDepth: number;
  anchorMainIndex?: number;
  forcedLabelHint?: string | null;
  forcedStoryTags?: string[];
};

type FloorBlueprint = {
  theme: DungeonFloorTheme;
  depthLabel: "0" | "-1" | "-2";
  environment: EnvironmentState;
  roomCountMin: number;
  roomCountMax: number;
  mainPathTypes: RoomType[];
  branchPool: RoomType[];
  signatureCandidates: Array<{
    roomType: RoomType;
    tag: string;
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
      depthLabel: "0",
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
        "shrine",
      ],
      signatureCandidates: [
        { roomType: "guard_post", tag: "setpiece:breach_chamber" },
        { roomType: "storage", tag: "setpiece:last_barracks" },
        { roomType: "shrine", tag: "setpiece:failed_shrine" },
        { roomType: "armory", tag: "setpiece:watchtower_stairwell" },
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
      theme: "wild_depths",
      depthLabel: "-1",
      environment: "dark",
      roomCountMin: 12,
      roomCountMax: 16,
      mainPathTypes: [
        "stairs_up",
        "corridor",
        "beast_den",
        "sentinel_hall",
        "ritual_chamber",
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
        "bone_pit",
      ],
      signatureCandidates: [
        { roomType: "ritual_chamber", tag: "setpiece:oathbound_gate" },
        { roomType: "bone_pit", tag: "setpiece:ossuary" },
        { roomType: "storage", tag: "setpiece:flooded_chamber" },
        { roomType: "corridor", tag: "setpiece:collapsed_passage" },
        { roomType: "sentinel_hall", tag: "setpiece:pre_gate_hall" },
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
      depthLabel: "-2",
      environment: "cold_dark",
      roomCountMin: 8,
      roomCountMax: 12,
      mainPathTypes: [
        "stairs_up",
        "crypt",
        "bone_pit",
        "crypt",
        "relic_vault",
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
      ],
      signatureCandidates: [
        { roomType: "relic_vault", tag: "setpiece:witness_antechamber" },
        { roomType: "ritual_chamber", tag: "setpiece:crypt_rite_hall" },
        { roomType: "crypt", tag: "setpiece:bone_vault" },
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

function buildFloorLabel(theme: DungeonFloorTheme, depthLabel: "0" | "-1" | "-2") {
  return `${FLOOR_THEME_DEFINITIONS[theme].label} — Floor ${depthLabel}`;
}

function buildRoomLabel(roomType: RoomType): string {
  return ROOM_TYPE_DEFINITIONS[roomType].label;
}

function defaultFeaturesForRoomType(roomType: RoomType): DungeonRoomFeature[] {
  const taxonomy = ROOM_TYPE_DEFINITIONS[roomType];
  return taxonomy.defaultFeatures.map((kind) => ({
    kind,
    discoveredByDefault: false,
    note: null,
  }));
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

function buildTrapStoryHint(trap: DungeonTrapDefinition): string[] {
  return [
    `trap:${trap.id}`,
    `trap_name:${trap.name}`,
    `trap_danger:${trap.danger}`,
    `trap_asset:${trap.assetPath}`,
  ];
}

function stringifyStoryTags(tags: string[]): string | null {
  const cleaned = tags.map((t) => t.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(" || ") : null;
}

function buildMainPathPlans(blueprint: FloorBlueprint): RoomNodePlan[] {
  return blueprint.mainPathTypes.map((roomType, index, all) => {
    let routeRole: RoomRole = "main_path";
    const isLast = index === all.length - 1;

    if (roomType === "boss_chamber") {
      routeRole = roomType === all[all.length - 1] ? "boss_approach" : "boss_approach";
    } else if (roomType === "stairs_down") {
      routeRole = "stairs_approach";
    }

    if (isLast && roomType !== "stairs_down") {
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

function attachSignatureTags(
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
    chosen.forcedStoryTags = [...(chosen.forcedStoryTags ?? []), candidate.tag];
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

  attachSignatureTags(rng, blueprint, allPlans);

  return allPlans;
}

function compatibleRoomTypesForPuzzle(puzzleId: PuzzleId): RoomType[] {
  switch (puzzleId) {
    case "whispering_anvil":
      return ["armory", "arcane_hall", "storage"];
    case "singing_chains":
      return ["corridor", "ritual_chamber", "sentinel_hall"];
    case "mirror_of_regrets":
      return ["shrine", "rest_site", "ritual_chamber"];
    case "pressure_gauges":
      return ["corridor", "guard_post", "sentinel_hall"];
    case "vault_of_unchosen_paths":
      return ["relic_vault", "treasure_room", "ritual_chamber"];
    case "oathbound_gate":
      return ["ritual_chamber", "sentinel_hall"];
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
    blueprint.depthLabel === "-1" &&
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
      if (plan.roomType === "corridor" || plan.roomType === "sentinel_hall") weight += 2;
      if (plan.roomType === "relic_vault" || plan.roomType === "treasure_room") weight += 2;
      if (plan.roomType === "ritual_chamber") weight += 1;
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
  if (isBranch && (toType === "relic_vault" || toType === "treasure_room")) return "door";
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

  // Main path chain
  for (let i = 0; i < mainPathIndexes.length - 1; i++) {
    const fromIndex = mainPathIndexes[i];
    const toIndex = mainPathIndexes[i + 1];
    const fromType = roomPlans[fromIndex].roomType;
    const toType = roomPlans[toIndex].roomType;

    const shouldLock =
      toType === "relic_vault" ||
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

  // Branch chains attached to anchor points
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
      const shouldLock = toType === "relic_vault";
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

  // Optional loop/secret connection
  if (rng() < loopChance && mainPathIndexes.length >= 5) {
    const fromMainIndex = pickOne(rng, mainPathIndexes.slice(1, Math.max(2, mainPathIndexes.length - 3)));
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

function applyEnvironmentStoryTags(
  blueprint: FloorBlueprint,
  plan: RoomNodePlan
): string[] {
  const tags: string[] = [`env:${blueprint.environment}`];

  if (blueprint.environment === "dark") {
    tags.push("requires:torch");
  }

  if (blueprint.environment === "cold_dark") {
    tags.push("requires:torch");
    tags.push("requires:warmth");
  }

  if (plan.roomType === "rest_site" || plan.roomType === "shrine") {
    if (blueprint.environment !== "lit") {
      tags.push("refuge:true");
      tags.push("fire_source:possible");
    }
  }

  return tags;
}

function applyRoleStoryTags(plan: RoomNodePlan): string[] {
  return [
    `route:${plan.routeRole}`,
    `branch_depth:${plan.branchDepth}`,
  ];
}

function buildForcedLabelHint(plan: RoomNodePlan): string | null {
  if (plan.forcedLabelHint) return plan.forcedLabelHint;

  const tags = plan.forcedStoryTags ?? [];
  for (const tag of tags) {
    if (tag === "setpiece:breach_chamber") return "Breach Chamber";
    if (tag === "setpiece:last_barracks") return "Last Barracks";
    if (tag === "setpiece:failed_shrine") return "Fallen Shrine";
    if (tag === "setpiece:watchtower_stairwell") return "Watchtower Stairwell";
    if (tag === "setpiece:oathbound_gate") return "Oathbound Gate";
    if (tag === "setpiece:ossuary") return "Ossuary";
    if (tag === "setpiece:flooded_chamber") return "Flooded Chamber";
    if (tag === "setpiece:collapsed_passage") return "Collapsed Passage";
    if (tag === "setpiece:pre_gate_hall") return "Pre-Gate Hall";
    if (tag === "setpiece:witness_antechamber") return "Witness Antechamber";
    if (tag === "setpiece:crypt_rite_hall") return "Ritual Vault";
    if (tag === "setpiece:bone_vault") return "Bone Vault";
  }

  return null;
}

function buildLootHintForRoom(roomType: RoomType): DungeonRoom["lootHint"] {
  if (roomType === "relic_vault") return "relic";
  if (roomType === "treasure_room") return "treasure";
  if (roomType === "armory" || roomType === "storage") return "supplies";
  if (roomType === "rest_site") return "cache";
  if (roomType === "crypt") return "cache";
  return null;
}

function buildRoomsForPlans(args: {
  rng: () => number;
  floorId: FloorId;
  floorIndex: number;
  blueprint: FloorBlueprint;
  roomPlans: RoomNodePlan[];
  puzzleAssignments: Map<number, PuzzleId>;
  trapIndexes: Set<number>;
}): DungeonRoom[] {
  const { rng, floorId, floorIndex, blueprint, roomPlans, puzzleAssignments, trapIndexes } = args;

  return roomPlans.map((plan, roomIndex) => {
    const roomId = makeRoomId(floorIndex, roomIndex);
    const encounterSeed = inferEncounterSeedForRoom(plan.roomType);
    const lootHint = buildLootHintForRoom(plan.roomType);

    const features = defaultFeaturesForRoomType(plan.roomType);
    const storyTags: string[] = [
      `floor_depth:${blueprint.depthLabel}`,
      `theme:${blueprint.theme}`,
      ...applyEnvironmentStoryTags(blueprint, plan),
      ...applyRoleStoryTags(plan),
      ...(plan.forcedStoryTags ?? []),
    ];

    if (lootHint) {
      storyTags.push(`loot:${lootHint}`);
    }

    if (puzzleAssignments.has(roomIndex)) {
      const puzzleId = puzzleAssignments.get(roomIndex)!;
      storyTags.push(`puzzle:${puzzleId}`);
      features.push({
        kind: "hazard",
        discoveredByDefault: false,
        note: `puzzle:${puzzleId}`,
      });
    }

    if (trapIndexes.has(roomIndex)) {
      const trap = chooseTrapForRoom(rng, plan.roomType, blueprint.theme);
      if (trap) {
        storyTags.push(...buildTrapStoryHint(trap));

        const hazardIndex = features.findIndex((f) => f.kind === "hazard");
        if (hazardIndex >= 0) {
          features[hazardIndex] = {
            ...features[hazardIndex],
            note: trap.id,
          };
        } else {
          features.push({
            kind: "hazard",
            discoveredByDefault: false,
            note: trap.id,
          });
        }
      }
    }

    const forcedLabelHint = buildForcedLabelHint(plan);
    if (forcedLabelHint) {
      storyTags.push(`label_hint:${forcedLabelHint}`);
    }

    return {
      id: roomId,
      floorId,
      roomType: plan.roomType,
      label: forcedLabelHint ?? buildRoomLabel(plan.roomType),
      discoverable: roomIndex !== 0,
      discoveredByDefault: roomIndex === 0,
      features,
      encounterSeed,
      lootHint,
      storyHint: stringifyStoryTags(storyTags),
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

  const roomPlans = buildFloorPlans(rng, blueprint);
  const puzzleAssignments = placePuzzlesOnPlans(rng, blueprint, roomPlans);
  const trapIndexes = new Set(
    chooseTrapRoomIndexes(rng, blueprint, roomPlans, puzzleAssignments)
  );

  const rooms = buildRoomsForPlans({
    rng,
    floorId,
    floorIndex,
    blueprint,
    roomPlans,
    puzzleAssignments,
    trapIndexes,
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
    theme: blueprint.theme,
    label: buildFloorLabel(blueprint.theme, blueprint.depthLabel),
    startRoomId: rooms[0].id,
    bossRoomId: bossRoom.id,
    rooms,
    connections,
  };
}

export function generateDungeon(args: GeneratorArgs): DungeonDefinition {
  const seed = String(args.seed || "echoes-of-fate");
  const dungeonId = String(args.dungeonId || "echoes_dungeon");

  // Echoes of Fate is now explicitly a 3-floor game:
  // Floor 0, Floor -1, Floor -2 (crypt)
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
