// lib/dungeon/ExplorationDiscovery.ts
// ------------------------------------------------------------
// Echoes of Fate — Room/Floor Exploration Discovery
// ------------------------------------------------------------
// Purpose:
// - Derive deterministic room/floor discovery drafts from dungeon structure
// - Emit canon drafts only when truths become newly visible
// - Replace tile-hash discovery with room/connection/feature discovery
//
// Notes:
// - Pure module: no mutation, no IDs, no timestamps
// - Reads current canon only to avoid duplicate discovery
// ------------------------------------------------------------

import type {
  DungeonEventDraft,
  FloorId,
  RoomId,
} from "@/lib/dungeon/DungeonEvents";
import { makeDungeonEventDraft } from "@/lib/dungeon/DungeonEvents";
import type {
  DungeonConnection,
  DungeonDefinition,
  DungeonFloor,
  DungeonRoom,
} from "@/lib/dungeon/FloorState";
import {
  getConnectedRoomId,
  getConnectionsForRoom,
  getFloorById,
  getRoomById,
} from "@/lib/dungeon/FloorState";

type SessionLikeEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

export type DiscoveryContext = {
  dungeon: DungeonDefinition;
  events: readonly SessionLikeEvent[];
  floorId: FloorId;
  roomId: RoomId;
  enteredViaConnectionId?: string | null;
  enteredFromRoomId?: string | null;
};

type RoomFeatureRevealedDraft = DungeonEventDraft<"ROOM_FEATURE_REVEALED">;
type StairsDiscoveredDraft = DungeonEventDraft<"STAIRS_DISCOVERED">;

function isRoomFeatureRevealedDraft(
  draft: DungeonEventDraft
): draft is RoomFeatureRevealedDraft {
  return draft.type === "ROOM_FEATURE_REVEALED";
}

function isStairsDiscoveredDraft(
  draft: DungeonEventDraft
): draft is StairsDiscoveredDraft {
  return draft.type === "STAIRS_DISCOVERED";
}

function safeStr(x: unknown): string | null {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function alreadyHasRoomRevealed(
  events: readonly SessionLikeEvent[],
  floorId: FloorId,
  roomId: RoomId
) {
  return events.some((e) => {
    if (e?.type !== "ROOM_REVEALED") return false;
    const p = isRecord(e?.payload) ? e.payload : {};
    return p.floorId === floorId && p.roomId === roomId;
  });
}

function alreadyHasRoomEntered(
  events: readonly SessionLikeEvent[],
  floorId: FloorId,
  roomId: RoomId
) {
  return events.some((e) => {
    if (e?.type !== "ROOM_ENTERED") return false;
    const p = isRecord(e?.payload) ? e.payload : {};
    return p.floorId === floorId && p.roomId === roomId;
  });
}

function alreadyHasConnectionDiscovered(
  events: readonly SessionLikeEvent[],
  connectionId: string
) {
  return events.some((e) => {
    if (e?.type !== "ROOM_CONNECTION_DISCOVERED") return false;
    const p = isRecord(e?.payload) ? e.payload : {};
    return p.connectionId === connectionId;
  });
}

function alreadyHasDoorDiscovered(
  events: readonly SessionLikeEvent[],
  doorId: string
) {
  return events.some((e) => {
    if (e?.type !== "DOOR_DISCOVERED") return false;
    const p = isRecord(e?.payload) ? e.payload : {};
    return p.doorId === doorId;
  });
}

function alreadyHasFeatureRevealed(
  events: readonly SessionLikeEvent[],
  floorId: FloorId,
  roomId: RoomId,
  featureKind: string
) {
  return events.some((e) => {
    if (e?.type !== "ROOM_FEATURE_REVEALED") return false;
    const p = isRecord(e?.payload) ? e.payload : {};
    return (
      p.floorId === floorId &&
      p.roomId === roomId &&
      p.featureKind === featureKind
    );
  });
}

function alreadyHasStairsDiscovered(
  events: readonly SessionLikeEvent[],
  floorId: FloorId,
  roomId: RoomId
) {
  return events.some((e) => {
    if (e?.type !== "STAIRS_DISCOVERED") return false;
    const p = isRecord(e?.payload) ? e.payload : {};
    return p.floorId === floorId && p.roomId === roomId;
  });
}

function inferDiscoveredVia(args: {
  room: DungeonRoom;
  enteredViaConnectionId?: string | null;
}): "entry" | "door" | "stairs" | "spawn" {
  if (args.room.discoveredByDefault) return "spawn";
  if (!args.enteredViaConnectionId) return "entry";

  if (args.room.roomType === "stairs_down" || args.room.roomType === "stairs_up") {
    return "stairs";
  }

  return "door";
}

function buildRoomRevealDraft(
  floorId: FloorId,
  room: DungeonRoom,
  enteredViaConnectionId?: string | null
): DungeonEventDraft<"ROOM_REVEALED"> {
  return makeDungeonEventDraft("ROOM_REVEALED", {
    floorId,
    roomId: room.id,
    roomType: room.roomType,
    discoveredVia: inferDiscoveredVia({ room, enteredViaConnectionId }),
  });
}

function buildRoomEnterDraft(args: {
  floorId: FloorId;
  room: DungeonRoom;
  fromRoomId?: string | null;
  viaConnectionId?: string | null;
  viaConnectionType?: string | null;
}): DungeonEventDraft<"ROOM_ENTERED"> {
  return makeDungeonEventDraft("ROOM_ENTERED", {
    floorId: args.floorId,
    roomId: args.room.id,
    roomType: args.room.roomType,
    fromRoomId: args.fromRoomId ?? null,
    viaConnectionId: args.viaConnectionId ?? null,
    viaConnectionType: (args.viaConnectionType as any) ?? null,
  });
}

function buildConnectionDiscoveryDraft(
  floorId: FloorId,
  fromRoomId: RoomId,
  connection: DungeonConnection
): DungeonEventDraft<"ROOM_CONNECTION_DISCOVERED"> {
  const toRoomId = getConnectedRoomId(connection, fromRoomId) ?? connection.toRoomId;

  return makeDungeonEventDraft("ROOM_CONNECTION_DISCOVERED", {
    floorId,
    fromRoomId,
    toRoomId,
    connectionId: connection.id,
    connectionType: connection.type,
  });
}

function buildDoorDiscoveryDraft(
  floorId: FloorId,
  roomId: RoomId,
  connection: DungeonConnection
): DungeonEventDraft<"DOOR_DISCOVERED"> | null {
  if (!connection.doorId) return null;

  return makeDungeonEventDraft("DOOR_DISCOVERED", {
    floorId,
    roomId,
    doorId: connection.doorId,
    connectionId: connection.id,
    locked: connection.locked === true || connection.type === "locked_door",
    note: connection.type === "locked_door" ? "locked" : null,
  });
}

function buildFeatureDrafts(
  floorId: FloorId,
  room: DungeonRoom
): DungeonEventDraft[] {
  const out: DungeonEventDraft[] = [];

  for (const feature of room.features) {
    if (feature.kind === "stairs") {
      const direction =
        room.roomType === "stairs_up" ? "up" : "down";

      out.push(
        makeDungeonEventDraft("STAIRS_DISCOVERED", {
          floorId,
          roomId: room.id,
          direction,
          targetFloorId: null,
        })
      );
      continue;
    }

    out.push(
      makeDungeonEventDraft("ROOM_FEATURE_REVEALED", {
        floorId,
        roomId: room.id,
        featureKind: feature.kind,
        note: feature.note ?? null,
      })
    );
  }

  return out;
}

function buildCurrentRoomDiscoveryDrafts(
  ctx: DiscoveryContext,
  floor: DungeonFloor,
  room: DungeonRoom
): DungeonEventDraft[] {
  const drafts: DungeonEventDraft[] = [];
  const events = ctx.events;

  if (!alreadyHasRoomRevealed(events, ctx.floorId, ctx.roomId)) {
    drafts.push(buildRoomRevealDraft(ctx.floorId, room, ctx.enteredViaConnectionId));
  }

  if (!alreadyHasRoomEntered(events, ctx.floorId, ctx.roomId)) {
    const viaConnection =
      ctx.enteredViaConnectionId
        ? floor.connections.find((c) => c.id === ctx.enteredViaConnectionId) ?? null
        : null;

    drafts.push(
      buildRoomEnterDraft({
        floorId: ctx.floorId,
        room,
        fromRoomId: ctx.enteredFromRoomId ?? null,
        viaConnectionId: ctx.enteredViaConnectionId ?? null,
        viaConnectionType: viaConnection?.type ?? null,
      })
    );
  }

  const currentConnections = getConnectionsForRoom(floor, room.id);
  for (const connection of currentConnections) {
    if (!alreadyHasConnectionDiscovered(events, connection.id)) {
      drafts.push(buildConnectionDiscoveryDraft(ctx.floorId, room.id, connection));
    }

    if (connection.doorId && !alreadyHasDoorDiscovered(events, connection.doorId)) {
      const draft = buildDoorDiscoveryDraft(ctx.floorId, room.id, connection);
      if (draft) drafts.push(draft);
    }
  }

  for (const featureDraft of buildFeatureDrafts(ctx.floorId, room)) {
    if (isRoomFeatureRevealedDraft(featureDraft)) {
      const kind = featureDraft.payload.featureKind;
      if (alreadyHasFeatureRevealed(events, ctx.floorId, room.id, kind)) continue;
    }

    if (isStairsDiscoveredDraft(featureDraft)) {
      if (alreadyHasStairsDiscovered(events, ctx.floorId, room.id)) continue;
    }

    drafts.push(featureDraft);
  }

  return drafts;
}

function buildAdjacentRevealDrafts(
  ctx: DiscoveryContext,
  floor: DungeonFloor,
  room: DungeonRoom
): DungeonEventDraft[] {
  const drafts: DungeonEventDraft[] = [];
  const events = ctx.events;

  const connections = getConnectionsForRoom(floor, room.id);
  for (const connection of connections) {
    const nextRoomId = getConnectedRoomId(connection, room.id);
    if (!nextRoomId) continue;

    const nextRoom = getRoomById(ctx.dungeon, ctx.floorId, nextRoomId);
    if (!nextRoom) continue;
    if (alreadyHasRoomRevealed(events, ctx.floorId, nextRoomId)) continue;
    if (nextRoom.discoverable === false) continue;

    if (connection.type === "corridor" || connection.discoveredByDefault) {
      drafts.push(
        makeDungeonEventDraft("ROOM_REVEALED", {
          floorId: ctx.floorId,
          roomId: nextRoom.id,
          roomType: nextRoom.roomType,
          discoveredVia: "entry",
        })
      );
    }
  }

  return drafts;
}

export function deriveExplorationDiscoveryDrafts(
  ctx: DiscoveryContext
): DungeonEventDraft[] {
  const floor = getFloorById(ctx.dungeon, ctx.floorId);
  if (!floor) return [];

  const room = getRoomById(ctx.dungeon, ctx.floorId, ctx.roomId);
  if (!room) return [];

  const drafts: DungeonEventDraft[] = [];

  drafts.push(...buildCurrentRoomDiscoveryDrafts(ctx, floor, room));
  drafts.push(...buildAdjacentRevealDrafts(ctx, floor, room));

  const unique = new Map<string, DungeonEventDraft>();

  for (const draft of drafts) {
    const key =
      draft.type === "ROOM_REVEALED"
        ? `${draft.type}:${draft.payload.floorId}:${draft.payload.roomId}`
        : draft.type === "ROOM_ENTERED"
        ? `${draft.type}:${draft.payload.floorId}:${draft.payload.roomId}`
        : draft.type === "ROOM_CONNECTION_DISCOVERED"
        ? `${draft.type}:${draft.payload.connectionId}`
        : draft.type === "DOOR_DISCOVERED"
        ? `${draft.type}:${draft.payload.doorId}`
        : isRoomFeatureRevealedDraft(draft)
        ? `${draft.type}:${draft.payload.floorId}:${draft.payload.roomId}:${draft.payload.featureKind}`
        : draft.type === "STAIRS_DISCOVERED"
        ? `${draft.type}:${draft.payload.floorId}:${draft.payload.roomId}`
        : JSON.stringify(draft);

    if (!unique.has(key)) {
      unique.set(key, draft);
    }
  }

  return Array.from(unique.values());
}
