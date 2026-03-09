// lib/dungeon/FloorState.ts
// ------------------------------------------------------------
// Echoes of Fate — Floor / Room Graph State
// ------------------------------------------------------------
// Purpose:
// - Define the canonical room-graph structure for dungeon floors
// - Separate generated structure from runtime exploration derivation
// - Keep this file type-focused and free of side effects
// ------------------------------------------------------------

import type {
  ConnectionType,
  DungeonFloorTheme,
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
  storyHint?: string | null;
};

export type DungeonFloor = {
  id: FloorId;
  dungeonId: string;
  floorIndex: number;
  theme: DungeonFloorTheme;
  label: string;
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
