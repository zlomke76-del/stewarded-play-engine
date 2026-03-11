// lib/dungeon/DungeonNavigation.ts
// ------------------------------------------------------------
// Echoes of Fate — Dungeon Navigation
// ------------------------------------------------------------
// Purpose:
// - Derive the player's current dungeon location from canon events
// - Resolve room-to-room traversal through graph connections
// - Keep navigation deterministic and read-only
// - Provide orchestration helpers without mutating canon
//
// Current design alignment:
// - Supports fixed 3-floor structure: 0 / -1 / -2
// - Uses floor depth semantics instead of only sequence assumptions
// - Exposes environment-aware helpers for darkness / warmth / refuge
// ------------------------------------------------------------

import type { ConnectionType } from "@/lib/dungeon/RoomTypes";
import type {
  ConnectionId,
  DoorId,
  FloorChangedPayload,
  FloorId,
  PlayerUsedStairsPayload,
  RoomEnteredPayload,
  RoomExitedPayload,
  RoomId,
} from "@/lib/dungeon/DungeonEvents";
import {
  getConnectedRoomId,
  getConnectionsForRoom,
  getFloorByDepth,
  getFloorById,
  getRoomById,
  isRoomSafeRefuge,
  roomRequiresTorchlight,
  roomRequiresWarmth,
  type DungeonConnection,
  type DungeonDefinition,
  type DungeonFloor,
  type DungeonRoom,
  type DungeonRoomEnvironment,
  type FloorDepth,
  type RuntimeLocation,
} from "@/lib/dungeon/FloorState";

type SessionLikeEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

export type DerivedDungeonLocation = RuntimeLocation & {
  initialized: boolean;
};

export type TraversalIntent = {
  floorId: FloorId;
  fromRoomId: RoomId;
  connectionId: ConnectionId;
};

export type TraversalResolution =
  | {
      ok: true;
      floorId: FloorId;
      fromRoom: DungeonRoom;
      toRoom: DungeonRoom;
      connection: DungeonConnection;
      crossedDoorId?: DoorId | null;
      usedStairs: boolean;
      floorChanged: boolean;
      nextFloorId: FloorId;
      nextDepth: FloorDepth;
    }
  | {
      ok: false;
      reason:
        | "missing-floor"
        | "missing-room"
        | "missing-connection"
        | "connection-does-not-touch-room"
        | "locked-door"
        | "stairs-target-missing";
    };

export type DerivedLocationEnvironment = DungeonRoomEnvironment & {
  floorDepth: FloorDepth;
  floorId: FloorId;
  roomId: RoomId;
  roomType: DungeonRoom["roomType"];
  isSafeRefuge: boolean;
};

function safeStr(x: unknown): string | null {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function getDungeonInitializedPayload(events: readonly SessionLikeEvent[]) {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e?.type !== "DUNGEON_INITIALIZED") continue;
    const p = e?.payload;
    if (!isRecord(p)) continue;

    const startFloorId = safeStr(p.startFloorId);
    const startRoomId = safeStr(p.startRoomId);
    if (!startFloorId || !startRoomId) continue;

    return {
      startFloorId,
      startRoomId,
    };
  }

  return null;
}

export function deriveCurrentDungeonLocation(
  dungeon: DungeonDefinition,
  events: readonly SessionLikeEvent[]
): DerivedDungeonLocation {
  const init = getDungeonInitializedPayload(events);

  let floorId = init?.startFloorId ?? dungeon.startFloorId;
  let roomId = init?.startRoomId ?? dungeon.startRoomId;
  let initialized = !!init;

  for (const e of events) {
    const payload = isRecord(e?.payload) ? e.payload : {};

    if (e?.type === "FLOOR_CHANGED") {
      const p = payload as unknown as FloorChangedPayload;
      const nextFloorId = safeStr(p?.toFloorId);
      const nextRoomId = safeStr(p?.toRoomId);
      if (nextFloorId && nextRoomId) {
        floorId = nextFloorId;
        roomId = nextRoomId;
        initialized = true;
      }
      continue;
    }

    if (e?.type === "PLAYER_USED_STAIRS") {
      const p = payload as unknown as PlayerUsedStairsPayload;
      const nextFloorId = safeStr(p?.toFloorId);
      const nextRoomId = safeStr(p?.toRoomId);
      if (nextFloorId && nextRoomId) {
        floorId = nextFloorId;
        roomId = nextRoomId;
        initialized = true;
      }
      continue;
    }

    if (e?.type === "ROOM_ENTERED") {
      const p = payload as unknown as RoomEnteredPayload;
      const nextFloorId = safeStr(p?.floorId);
      const nextRoomId = safeStr(p?.roomId);
      if (nextFloorId && nextRoomId) {
        floorId = nextFloorId;
        roomId = nextRoomId;
        initialized = true;
      }
      continue;
    }
  }

  return {
    floorId,
    roomId,
    initialized,
  };
}

export function deriveDiscoveredRoomIds(events: readonly SessionLikeEvent[]): RoomId[] {
  const out = new Set<RoomId>();

  for (const e of events) {
    if (e?.type !== "ROOM_REVEALED" && e?.type !== "ROOM_ENTERED") continue;
    const p = isRecord(e?.payload) ? e.payload : {};
    const roomId = safeStr(p.roomId);
    if (!roomId) continue;
    out.add(roomId);
  }

  return Array.from(out);
}

export function deriveDiscoveredConnectionIds(
  events: readonly SessionLikeEvent[]
): ConnectionId[] {
  const out = new Set<ConnectionId>();

  for (const e of events) {
    if (e?.type !== "ROOM_CONNECTION_DISCOVERED") continue;
    const p = isRecord(e?.payload) ? e.payload : {};
    const connectionId = safeStr(p.connectionId);
    if (!connectionId) continue;
    out.add(connectionId);
  }

  return Array.from(out);
}

export function deriveOpenedDoorIds(events: readonly SessionLikeEvent[]): DoorId[] {
  const out = new Set<DoorId>();

  for (const e of events) {
    if (e?.type !== "DOOR_OPENED") continue;
    const p = isRecord(e?.payload) ? e.payload : {};
    const doorId = safeStr(p.doorId);
    if (!doorId) continue;
    out.add(doorId);
  }

  return Array.from(out);
}

export function deriveUnlockedDoorIds(events: readonly SessionLikeEvent[]): DoorId[] {
  const out = new Set<DoorId>();

  for (const e of events) {
    if (e?.type !== "DOOR_UNLOCKED") continue;
    const p = isRecord(e?.payload) ? e.payload : {};
    const doorId = safeStr(p.doorId);
    if (!doorId) continue;
    out.add(doorId);
  }

  return Array.from(out);
}

export function findRoom(
  dungeon: DungeonDefinition,
  floorId: FloorId,
  roomId: RoomId
): DungeonRoom | null {
  return getRoomById(dungeon, floorId, roomId);
}

export function findFloor(
  dungeon: DungeonDefinition,
  floorId: FloorId
): DungeonFloor | null {
  return getFloorById(dungeon, floorId);
}

export function findConnectionForRoom(
  floor: DungeonFloor,
  roomId: RoomId,
  connectionId: ConnectionId
): DungeonConnection | null {
  return getConnectionsForRoom(floor, roomId).find((c) => c.id === connectionId) ?? null;
}

export function deriveReachableConnections(
  dungeon: DungeonDefinition,
  location: RuntimeLocation
): DungeonConnection[] {
  const floor = findFloor(dungeon, location.floorId);
  if (!floor) return [];
  return getConnectionsForRoom(floor, location.roomId);
}

export function inferNeighborRoomIds(
  dungeon: DungeonDefinition,
  location: RuntimeLocation
): RoomId[] {
  const floor = findFloor(dungeon, location.floorId);
  if (!floor) return [];

  return getConnectionsForRoom(floor, location.roomId)
    .map((connection) => getConnectedRoomId(connection, location.roomId))
    .filter((id): id is RoomId => !!id);
}

function inferStairsTargetDepth(
  floor: DungeonFloor,
  connection: DungeonConnection
): FloorDepth | null {
  if (connection.type !== "stairs") return floor.depth;

  if (connection.note === "up") {
    if (floor.depth === -2) return -1;
    if (floor.depth === -1) return 0;
    return null;
  }

  if (connection.note === "down") {
    if (floor.depth === 0) return -1;
    if (floor.depth === -1) return -2;
    return null;
  }

  // Default deterministic assumption if note is missing.
  if (floor.depth === 0) return -1;
  if (floor.depth === -1) return -2;
  return null;
}

function deriveFloorEntryRoomId(targetFloor: DungeonFloor, direction: "up" | "down"): RoomId {
  const preferredType = direction === "down" ? "stairs_up" : "stairs_down";
  const room =
    targetFloor.rooms.find((r) => r.roomType === preferredType) ?? targetFloor.rooms[0];
  return room.id;
}

export function resolveTraversal(
  dungeon: DungeonDefinition,
  args: {
    floorId: FloorId;
    roomId: RoomId;
    connectionId: ConnectionId;
    openedDoorIds?: readonly DoorId[];
    unlockedDoorIds?: readonly DoorId[];
  }
): TraversalResolution {
  const {
    floorId,
    roomId,
    connectionId,
    openedDoorIds = [],
    unlockedDoorIds = [],
  } = args;

  const floor = findFloor(dungeon, floorId);
  if (!floor) return { ok: false, reason: "missing-floor" };

  const fromRoom = findRoom(dungeon, floorId, roomId);
  if (!fromRoom) return { ok: false, reason: "missing-room" };

  const connection = findConnectionForRoom(floor, roomId, connectionId);
  if (!connection) return { ok: false, reason: "missing-connection" };

  const targetRoomId = getConnectedRoomId(connection, roomId);
  if (!targetRoomId) {
    return { ok: false, reason: "connection-does-not-touch-room" };
  }

  const doorId = connection.doorId ?? null;
  const locked =
    connection.locked === true && (!doorId || !unlockedDoorIds.includes(doorId));

  if (connection.type === "locked_door" && locked) {
    return { ok: false, reason: "locked-door" };
  }

  const targetRoom = findRoom(dungeon, floorId, targetRoomId);
  if (!targetRoom) return { ok: false, reason: "missing-room" };

  if (connection.type !== "stairs") {
    return {
      ok: true,
      floorId,
      fromRoom,
      toRoom: targetRoom,
      connection,
      crossedDoorId: doorId,
      usedStairs: false,
      floorChanged: false,
      nextFloorId: floorId,
      nextDepth: floor.depth,
    };
  }

  const targetDepth = inferStairsTargetDepth(floor, connection);
  if (targetDepth == null) {
    return { ok: false, reason: "stairs-target-missing" };
  }

  const targetFloor = getFloorByDepth(dungeon, targetDepth);
  if (!targetFloor) {
    return { ok: false, reason: "stairs-target-missing" };
  }

  const direction = connection.note === "up" ? "up" : "down";
  const entryRoomId = deriveFloorEntryRoomId(targetFloor, direction);
  const entryRoom = findRoom(dungeon, targetFloor.id, entryRoomId);
  if (!entryRoom) {
    return { ok: false, reason: "stairs-target-missing" };
  }

  return {
    ok: true,
    floorId,
    fromRoom,
    toRoom: entryRoom,
    connection,
    crossedDoorId: doorId,
    usedStairs: true,
    floorChanged: targetFloor.id !== floorId,
    nextFloorId: targetFloor.id,
    nextDepth: targetFloor.depth,
  };
}

export function deriveLocationEnvironment(
  dungeon: DungeonDefinition,
  location: RuntimeLocation
): DerivedLocationEnvironment | null {
  const floor = findFloor(dungeon, location.floorId);
  const room = findRoom(dungeon, location.floorId, location.roomId);

  if (!floor || !room) return null;

  const environment =
    room.environment ?? {
      pressure: floor.environmentPressure,
      requiresTorchlight: floor.requiresTorchlight,
      requiresWarmth: floor.requiresWarmth,
      isRefuge: false,
      hasFireSource: false,
    };

  return {
    ...environment,
    floorDepth: floor.depth,
    floorId: floor.id,
    roomId: room.id,
    roomType: room.roomType,
    isSafeRefuge: isRoomSafeRefuge(dungeon, location.floorId, location.roomId),
  };
}

export function doesLocationRequireTorchlight(
  dungeon: DungeonDefinition,
  location: RuntimeLocation
): boolean {
  return roomRequiresTorchlight(dungeon, location.floorId, location.roomId);
}

export function doesLocationRequireWarmth(
  dungeon: DungeonDefinition,
  location: RuntimeLocation
): boolean {
  return roomRequiresWarmth(dungeon, location.floorId, location.roomId);
}

export function isLocationSafeRefuge(
  dungeon: DungeonDefinition,
  location: RuntimeLocation
): boolean {
  return isRoomSafeRefuge(dungeon, location.floorId, location.roomId);
}

export function deriveTraversalPreview(args: {
  dungeon: DungeonDefinition;
  location: RuntimeLocation;
  connectionId: ConnectionId;
  openedDoorIds?: readonly DoorId[];
  unlockedDoorIds?: readonly DoorId[];
}) {
  const resolution = resolveTraversal(args.dungeon, {
    floorId: args.location.floorId,
    roomId: args.location.roomId,
    connectionId: args.connectionId,
    openedDoorIds: args.openedDoorIds,
    unlockedDoorIds: args.unlockedDoorIds,
  });

  if (!resolution.ok) return null;

  const targetEnvironment = deriveLocationEnvironment(args.dungeon, {
    floorId: resolution.nextFloorId,
    roomId: resolution.toRoom.id,
  });

  return {
    floorChanged: resolution.floorChanged,
    nextFloorId: resolution.nextFloorId,
    nextDepth: resolution.nextDepth,
    nextRoomId: resolution.toRoom.id,
    nextRoomLabel: resolution.toRoom.label,
    targetEnvironment,
  };
}

export function buildTraversalNarrativeContext(args: {
  connectionType: ConnectionType;
  fromRoomLabel: string;
  toRoomLabel: string;
  usedStairs: boolean;
  floorChanged: boolean;
  fromDepth?: FloorDepth | null;
  toDepth?: FloorDepth | null;
}): string {
  const {
    connectionType,
    fromRoomLabel,
    toRoomLabel,
    usedStairs,
    floorChanged,
    fromDepth = null,
    toDepth = null,
  } = args;

  if (usedStairs && floorChanged) {
    if (fromDepth != null && toDepth != null) {
      if (toDepth < fromDepth) {
        return `You leave ${fromRoomLabel} and descend from Floor ${fromDepth} into ${toRoomLabel} on Floor ${toDepth}.`;
      }
      if (toDepth > fromDepth) {
        return `You leave ${fromRoomLabel} and climb from Floor ${fromDepth} into ${toRoomLabel} on Floor ${toDepth}.`;
      }
    }

    return `You leave ${fromRoomLabel} and pass by stairs into ${toRoomLabel}.`;
  }

  if (connectionType === "locked_door") {
    return `You force passage from ${fromRoomLabel} into ${toRoomLabel} through a once-locked barrier.`;
  }

  if (connectionType === "door") {
    return `You pass from ${fromRoomLabel} through a doorway into ${toRoomLabel}.`;
  }

  if (connectionType === "secret") {
    return `A hidden route opens from ${fromRoomLabel} into ${toRoomLabel}.`;
  }

  return `You move from ${fromRoomLabel} into ${toRoomLabel}.`;
}

export function buildRoomExitPayload(args: {
  floorId: FloorId;
  roomId: RoomId;
  toRoomId?: RoomId | null;
  viaConnectionId?: ConnectionId | null;
}): RoomExitedPayload {
  return {
    floorId: args.floorId,
    roomId: args.roomId,
    toRoomId: args.toRoomId ?? null,
    viaConnectionId: args.viaConnectionId ?? null,
  };
}
