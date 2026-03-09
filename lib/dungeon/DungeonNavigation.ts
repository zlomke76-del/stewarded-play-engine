// lib/dungeon/DungeonNavigation.ts
// ------------------------------------------------------------
// Echoes of Fate — Dungeon Navigation
// ------------------------------------------------------------
// Purpose:
// - Derive the player's current dungeon location from canon events
// - Resolve room-to-room traversal through graph connections
// - Keep navigation deterministic and read-only
// - Provide orchestration helpers without mutating canon
// ------------------------------------------------------------

import type {
  ConnectionType,
} from "@/lib/dungeon/RoomTypes";
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
  getFloorById,
  getRoomById,
  type DungeonConnection,
  type DungeonDefinition,
  type DungeonFloor,
  type DungeonRoom,
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

export function deriveDiscoveredConnectionIds(events: readonly SessionLikeEvent[]): ConnectionId[] {
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
  return (
    getConnectionsForRoom(floor, roomId).find((c) => c.id === connectionId) ?? null
  );
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

function inferStairsTargetFloorId(
  dungeon: DungeonDefinition,
  floor: DungeonFloor,
  connection: DungeonConnection
): FloorId | null {
  if (connection.type !== "stairs") return floor.id;

  const nextFloorIndex =
    connection.note === "up"
      ? floor.floorIndex - 1
      : floor.floorIndex + 1;

  const targetFloor = dungeon.floors.find((f) => f.floorIndex === nextFloorIndex) ?? null;
  return targetFloor?.id ?? null;
}

function deriveFloorEntryRoomId(targetFloor: DungeonFloor, direction: "up" | "down"): RoomId {
  const preferredType = direction === "down" ? "stairs_up" : "stairs_down";
  const room =
    targetFloor.rooms.find((r) => r.roomType === preferredType) ??
    targetFloor.rooms[0];
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
    connection.locked === true &&
    (!doorId || !unlockedDoorIds.includes(doorId));

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
    };
  }

  const targetFloorId = inferStairsTargetFloorId(dungeon, floor, connection);
  if (!targetFloorId) {
    return { ok: false, reason: "stairs-target-missing" };
  }

  const targetFloor = findFloor(dungeon, targetFloorId);
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
  };
}

export function buildTraversalNarrativeContext(args: {
  connectionType: ConnectionType;
  fromRoomLabel: string;
  toRoomLabel: string;
  usedStairs: boolean;
  floorChanged: boolean;
}): string {
  const {
    connectionType,
    fromRoomLabel,
    toRoomLabel,
    usedStairs,
    floorChanged,
  } = args;

  if (usedStairs && floorChanged) {
    return `You leave ${fromRoomLabel} and descend into ${toRoomLabel}.`;
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
