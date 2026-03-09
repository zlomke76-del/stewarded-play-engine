// lib/dungeon/DungeonEvents.ts
// ------------------------------------------------------------
// Echoes of Fate — Dungeon Event Vocabulary
// ------------------------------------------------------------
// Purpose:
// - Centralize typed event names + payload shapes for room/floor exploration
// - Prevent string drift across orchestrator, map, pressure, and discovery layers
// - Keep SessionState generic while giving dungeon systems a stable contract
// ------------------------------------------------------------

import type {
  ConnectionType,
  DungeonFloorTheme,
  RoomFeatureKind,
  RoomType,
} from "@/lib/dungeon/RoomTypes";

export type FloorId = string;
export type RoomId = string;
export type ConnectionId = string;
export type DoorId = string;

export type DungeonEventType =
  | "DUNGEON_INITIALIZED"
  | "FLOOR_INITIALIZED"
  | "ROOM_CONNECTION_DISCOVERED"
  | "ROOM_REVEALED"
  | "ROOM_ENTERED"
  | "ROOM_EXITED"
  | "DOOR_DISCOVERED"
  | "DOOR_UNLOCKED"
  | "DOOR_OPENED"
  | "ROOM_FEATURE_REVEALED"
  | "STAIRS_DISCOVERED"
  | "PLAYER_USED_STAIRS"
  | "FLOOR_CHANGED"
  | "LOCATION_PRESSURE_CHANGED"
  | "LOCATION_AWARENESS_CHANGED"
  | "LOCATION_RESPONSE_TRIGGERED";

export type DungeonInitializedPayload = {
  dungeonId: string;
  seed: string;
  floorIds: FloorId[];
  startFloorId: FloorId;
  startRoomId: RoomId;
};

export type FloorInitializedPayload = {
  dungeonId: string;
  floorId: FloorId;
  floorIndex: number;
  theme: DungeonFloorTheme;
  startRoomId: RoomId;
};

export type RoomConnectionDiscoveredPayload = {
  floorId: FloorId;
  fromRoomId: RoomId;
  toRoomId: RoomId;
  connectionId: ConnectionId;
  connectionType: ConnectionType;
};

export type RoomRevealedPayload = {
  floorId: FloorId;
  roomId: RoomId;
  roomType: RoomType;
  discoveredVia?: "entry" | "door" | "scout" | "stairs" | "spawn";
};

export type RoomEnteredPayload = {
  floorId: FloorId;
  roomId: RoomId;
  roomType: RoomType;
  fromRoomId?: RoomId | null;
  viaConnectionId?: ConnectionId | null;
  viaConnectionType?: ConnectionType | null;
};

export type RoomExitedPayload = {
  floorId: FloorId;
  roomId: RoomId;
  toRoomId?: RoomId | null;
  viaConnectionId?: ConnectionId | null;
};

export type DoorDiscoveredPayload = {
  floorId: FloorId;
  roomId: RoomId;
  doorId: DoorId;
  connectionId: ConnectionId;
  locked: boolean;
  note?: string | null;
};

export type DoorUnlockedPayload = {
  floorId: FloorId;
  roomId: RoomId;
  doorId: DoorId;
  connectionId: ConnectionId;
  method?: "key" | "ritual" | "force" | "tool" | "unknown";
};

export type DoorOpenedPayload = {
  floorId: FloorId;
  roomId: RoomId;
  doorId: DoorId;
  connectionId: ConnectionId;
  revealedRoomId: RoomId;
};

export type RoomFeatureRevealedPayload = {
  floorId: FloorId;
  roomId: RoomId;
  featureKind: RoomFeatureKind;
  note?: string | null;
};

export type StairsDiscoveredPayload = {
  floorId: FloorId;
  roomId: RoomId;
  direction: "up" | "down";
  targetFloorId?: FloorId | null;
};

export type PlayerUsedStairsPayload = {
  fromFloorId: FloorId;
  fromRoomId: RoomId;
  toFloorId: FloorId;
  toRoomId: RoomId;
  direction: "up" | "down";
};

export type FloorChangedPayload = {
  fromFloorId: FloorId;
  toFloorId: FloorId;
  fromRoomId: RoomId;
  toRoomId: RoomId;
};

export type LocationPressureChangedPayload = {
  floorId: FloorId;
  roomId: RoomId;
  delta: number;
};

export type LocationAwarenessChangedPayload = {
  floorId: FloorId;
  roomId: RoomId;
  delta: number;
};

export type LocationResponseTriggeredPayload = {
  floorId: FloorId;
  roomId: RoomId;
  resetTo?: number;
};

export type DungeonPayloadByType = {
  DUNGEON_INITIALIZED: DungeonInitializedPayload;
  FLOOR_INITIALIZED: FloorInitializedPayload;
  ROOM_CONNECTION_DISCOVERED: RoomConnectionDiscoveredPayload;
  ROOM_REVEALED: RoomRevealedPayload;
  ROOM_ENTERED: RoomEnteredPayload;
  ROOM_EXITED: RoomExitedPayload;
  DOOR_DISCOVERED: DoorDiscoveredPayload;
  DOOR_UNLOCKED: DoorUnlockedPayload;
  DOOR_OPENED: DoorOpenedPayload;
  ROOM_FEATURE_REVEALED: RoomFeatureRevealedPayload;
  STAIRS_DISCOVERED: StairsDiscoveredPayload;
  PLAYER_USED_STAIRS: PlayerUsedStairsPayload;
  FLOOR_CHANGED: FloorChangedPayload;
  LOCATION_PRESSURE_CHANGED: LocationPressureChangedPayload;
  LOCATION_AWARENESS_CHANGED: LocationAwarenessChangedPayload;
  LOCATION_RESPONSE_TRIGGERED: LocationResponseTriggeredPayload;
};

export type DungeonEventDraft<T extends DungeonEventType = DungeonEventType> = {
  type: T;
  payload: DungeonPayloadByType[T];
};

export function isDungeonEventType(type: string): type is DungeonEventType {
  return (
    type === "DUNGEON_INITIALIZED" ||
    type === "FLOOR_INITIALIZED" ||
    type === "ROOM_CONNECTION_DISCOVERED" ||
    type === "ROOM_REVEALED" ||
    type === "ROOM_ENTERED" ||
    type === "ROOM_EXITED" ||
    type === "DOOR_DISCOVERED" ||
    type === "DOOR_UNLOCKED" ||
    type === "DOOR_OPENED" ||
    type === "ROOM_FEATURE_REVEALED" ||
    type === "STAIRS_DISCOVERED" ||
    type === "PLAYER_USED_STAIRS" ||
    type === "FLOOR_CHANGED" ||
    type === "LOCATION_PRESSURE_CHANGED" ||
    type === "LOCATION_AWARENESS_CHANGED" ||
    type === "LOCATION_RESPONSE_TRIGGERED"
  );
}

export function makeDungeonEventDraft<T extends DungeonEventType>(
  type: T,
  payload: DungeonPayloadByType[T]
): DungeonEventDraft<T> {
  return { type, payload };
}
