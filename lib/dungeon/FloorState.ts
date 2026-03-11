// lib/dungeon/FloorState.ts
// ------------------------------------------------------------
// Echoes of Fate — Floor / Room Graph State
// ------------------------------------------------------------
// Purpose:
// - Define the canonical room-graph structure for dungeon floors
// - Separate generated structure from runtime exploration derivation
// - Keep this file type-focused and free of side effects
//
// Current design alignment:
// - Fixed 3-floor dungeon:
//   Floor 0   = ruined outpost
//   Floor -1  = deep warrens
//   Floor -2  = forgotten crypt
// - Supports persistent-hero / fresh-run generation model
// - Supports richer room metadata for puzzles, traps, route roles,
//   environment pressure, and signature rooms
// ------------------------------------------------------------

import type {
  ConnectionType,
  DungeonFloorTheme,
  EnvironmentPressure,
  RoomFeatureKind,
  RoomType,
} from "@/lib/dungeon/RoomTypes";
import type {
  ConnectionId,
  DoorId,
  FloorId,
  RoomId,
} from "@/lib/dungeon/DungeonEvents";
import type {
  EnemyArchetypeKey,
  EnemyEncounterDuty,
  EnemyEncounterTheme,
} from "@/lib/game/EnemyDatabase";

export type FloorDepth = 0 | -1 | -2;

export type RoomRouteRole =
  | "main_path"
  | "branch"
  | "dead_end"
  | "boss_approach"
  | "stairs_approach"
  | "signature"
  | "resource"
  | "puzzle";

export type PuzzleId =
  | "whispering_anvil"
  | "singing_chains"
  | "mirror_of_regrets"
  | "pressure_gauges"
  | "vault_of_unchosen_paths"
  | "oathbound_gate";

export type SetpieceId =
  | "breach_chamber"
  | "last_barracks"
  | "failed_shrine"
  | "watchtower_stairwell"
  | "oathbound_gate"
  | "ossuary"
  | "flooded_chamber"
  | "collapsed_passage"
  | "pre_gate_hall"
  | "witness_antechamber"
  | "crypt_rite_hall"
  | "bone_vault";

export type DungeonRoomFeature = {
  kind: RoomFeatureKind;
  discoveredByDefault?: boolean;
  note?: string | null;
};

export type DungeonEncounterSeed = {
  theme: EnemyEncounterTheme;
  duty?: EnemyEncounterDuty;
  enemyNames?: EnemyArchetypeKey[];
  canCarryKey?: boolean;
  canCarryRelic?: boolean;
  canGuardCache?: boolean;
  canGuardShrine?: boolean;
};

export type DungeonConnection = {
  id: ConnectionId;
  fromRoomId: RoomId;
  toRoomId: RoomId;
  type: ConnectionType;
  discoveredByDefault?: boolean;
  locked?: boolean;
  doorId?: DoorId | null;
  note?: string | null;
};

export type DungeonRoomEnvironment = {
  pressure: EnvironmentPressure;
  requiresTorchlight: boolean;
  requiresWarmth: boolean;
  isRefuge: boolean;
  hasFireSource: boolean;
};

export type DungeonRoom = {
  id: RoomId;
  floorId: FloorId;
  roomType: RoomType;
  label: string;
  discoverable: boolean;
  discoveredByDefault?: boolean;
  features: DungeonRoomFeature[];

  encounterSeed?: DungeonEncounterSeed | null;
  lootHint?: "cache" | "treasure" | "relic" | "supplies" | null;

  // Legacy text field retained for compatibility with older code paths
  storyHint?: string | null;

  // Structured metadata
  routeRole?: RoomRouteRole;
  branchDepth?: number;
  isMainPath?: boolean;
  isBranch?: boolean;
  isDeadEnd?: boolean;

  environment?: DungeonRoomEnvironment;

  puzzleId?: PuzzleId | null;
  trapId?: string | null;

  isSignature?: boolean;
  setpieceId?: SetpieceId | null;

  supportsTorchRefill?: boolean;
  supportsWarmth?: boolean;
};

export type DungeonFloor = {
  id: FloorId;
  dungeonId: string;
  floorIndex: number;
  depth: FloorDepth;
  theme: DungeonFloorTheme;
  label: string;

  environmentPressure: EnvironmentPressure;
  requiresTorchlight: boolean;
  requiresWarmth: boolean;

  startRoomId: RoomId;
  bossRoomId: RoomId;

  rooms: DungeonRoom[];
  connections: DungeonConnection[];
};

export type DungeonDefinition = {
  dungeonId: string;
  seed: string;
  floors: DungeonFloor[];
  startFloorId: FloorId;
  startRoomId: RoomId;
};

export type RuntimeLocation = {
  floorId: FloorId;
  roomId: RoomId;
};

export type DerivedExplorationState = {
  currentFloorId: FloorId;
  currentRoomId: RoomId;
  discoveredFloorIds: FloorId[];
  discoveredRoomIds: RoomId[];
  discoveredConnectionIds: ConnectionId[];
  openedDoorIds: DoorId[];
  unlockedDoorIds: DoorId[];
};

export function getFloorById(
  dungeon: DungeonDefinition,
  floorId: FloorId
): DungeonFloor | null {
  return dungeon.floors.find((f) => f.id === floorId) ?? null;
}

export function getRoomById(
  dungeon: DungeonDefinition,
  floorId: FloorId,
  roomId: RoomId
): DungeonRoom | null {
  const floor = getFloorById(dungeon, floorId);
  if (!floor) return null;
  return floor.rooms.find((r) => r.id === roomId) ?? null;
}

export function getConnectionsForRoom(
  floor: DungeonFloor,
  roomId: RoomId
): DungeonConnection[] {
  return floor.connections.filter(
    (c) => c.fromRoomId === roomId || c.toRoomId === roomId
  );
}

export function getConnectedRoomId(
  connection: DungeonConnection,
  roomId: RoomId
): RoomId | null {
  if (connection.fromRoomId === roomId) return connection.toRoomId;
  if (connection.toRoomId === roomId) return connection.fromRoomId;
  return null;
}

export function getFloorByDepth(
  dungeon: DungeonDefinition,
  depth: FloorDepth
): DungeonFloor | null {
  return dungeon.floors.find((f) => f.depth === depth) ?? null;
}

export function getRoomEnvironment(
  dungeon: DungeonDefinition,
  floorId: FloorId,
  roomId: RoomId
): DungeonRoomEnvironment | null {
  const floor = getFloorById(dungeon, floorId);
  const room = getRoomById(dungeon, floorId, roomId);
  if (!floor || !room) return null;

  return (
    room.environment ?? {
      pressure: floor.environmentPressure,
      requiresTorchlight: floor.requiresTorchlight,
      requiresWarmth: floor.requiresWarmth,
      isRefuge: false,
      hasFireSource: false,
    }
  );
}

export function isRoomSafeRefuge(
  dungeon: DungeonDefinition,
  floorId: FloorId,
  roomId: RoomId
): boolean {
  const environment = getRoomEnvironment(dungeon, floorId, roomId);
  return environment?.isRefuge === true;
}

export function roomRequiresTorchlight(
  dungeon: DungeonDefinition,
  floorId: FloorId,
  roomId: RoomId
): boolean {
  const environment = getRoomEnvironment(dungeon, floorId, roomId);
  return environment?.requiresTorchlight === true;
}

export function roomRequiresWarmth(
  dungeon: DungeonDefinition,
  floorId: FloorId,
  roomId: RoomId
): boolean {
  const environment = getRoomEnvironment(dungeon, floorId, roomId);
  return environment?.requiresWarmth === true;
}
