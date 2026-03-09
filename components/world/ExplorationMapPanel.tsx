"use client";

// ------------------------------------------------------------
// ExplorationMapPanel (READ-ONLY)
// ------------------------------------------------------------
// Room/Floor canon map renderer for Echoes of Fate.
// - Derives discovered rooms, connections, doors, features, and current room
//   purely from canon events
// - NO controls here
// - Soft discovery chime plays only when discovery expands after mount
//
// This replaces the old tile-grid visualization with a room graph view.
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
  mapW?: number;
  mapH?: number;
};

export type MapMarkKind = "door" | "stairs" | "altar" | "cache" | "hazard";

type RoomGraphRoom = {
  floorId: string;
  roomId: string;
  roomType: string | null;
  revealedAt: number;
  enteredAt: number | null;
};

type RoomGraphConnection = {
  connectionId: string;
  floorId: string;
  fromRoomId: string;
  toRoomId: string;
  connectionType: string;
  discoveredAt: number;
};

type DoorState = {
  doorId: string;
  floorId: string;
  roomId: string;
  connectionId: string | null;
  locked: boolean;
  opened: boolean;
  note: string | null;
};

type RoomFeature = {
  floorId: string;
  roomId: string;
  featureKind: string;
  note: string | null;
  timestamp: number;
};

type DerivedGraphState = {
  currentFloorId: string | null;
  currentRoomId: string | null;
  floorsInOrder: string[];
  currentFloorRooms: RoomGraphRoom[];
  currentFloorConnections: RoomGraphConnection[];
  roomFeaturesByRoom: Map<string, RoomFeature[]>;
  doorByConnectionId: Map<string, DoorState>;
  discoveredRoomCount: number;
  discoveredConnectionCount: number;
  discoveredFeatureCount: number;
};

type PositionedRoom = RoomGraphRoom & {
  x: number;
  y: number;
};

const ASSET_BASE = "/assets/v1";
const DISCOVERY_CHIME_SRC = "/assets/audio/sfx_soft_chime_01.mp3";

const NODE_W = 170;
const NODE_H = 76;
const COL_GAP = 84;
const ROW_GAP = 34;
const PAD_X = 28;
const PAD_Y = 24;

function roomKey(floorId: string, roomId: string) {
  return `${floorId}::${roomId}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function safeStr(x: unknown): string | null {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function safeNum(x: unknown): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}

function titleCase(input: string) {
  return input
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function labelForFloor(floorId: string) {
  const m = /floor[_-]?(\d+)/i.exec(floorId);
  if (m) return `Floor ${m[1]}`;
  return titleCase(floorId);
}

function labelForRoom(roomId: string, roomType?: string | null) {
  if (roomType && roomType.trim()) {
    const nice = titleCase(roomType);
    if (nice.toLowerCase() !== "room") return nice;
  }

  const tail = roomId
    .split(/[_-]+/)
    .filter(Boolean)
    .slice(-2)
    .join(" ");

  return tail ? titleCase(tail) : titleCase(roomId);
}

function labelForConnectionType(kind: string) {
  switch (kind) {
    case "corridor":
      return "Corridor";
    case "door":
      return "Door";
    case "locked_door":
      return "Locked Door";
    case "stairs":
      return "Stairs";
    case "secret":
      return "Secret";
    default:
      return titleCase(kind);
  }
}

function iconForFeature(kind: string): string {
  const k = kind.toLowerCase();

  if (k.includes("stairs")) return "⇩";
  if (k.includes("altar") || k.includes("shrine")) return "★";
  if (k.includes("cache") || k.includes("treasure") || k.includes("vault") || k.includes("relic")) return "💰";
  if (k.includes("hazard") || k.includes("trap")) return "⚠";
  if (k.includes("boss")) return "☠";
  if (k.includes("door")) return "🔒";
  if (k.includes("enemy") || k.includes("guard") || k.includes("beast")) return "⚔";
  if (k.includes("ritual")) return "✦";

  return "•";
}

function assetForPlayer(): { src: string; label: string } {
  return { src: `${ASSET_BASE}/player_rogue.png`, label: "Player" };
}

function playDiscoveryChime(volume = 0.38) {
  try {
    const audio = new Audio(DISCOVERY_CHIME_SRC);
    audio.volume = volume;
    void audio.play().catch(() => {
      // fail silently
    });
  } catch {
    // fail silently
  }
}

function deriveGraphState(events: readonly SessionEvent[]): DerivedGraphState {
  const rooms = new Map<string, RoomGraphRoom>();
  const connections = new Map<string, RoomGraphConnection>();
  const doorByConnectionId = new Map<string, DoorState>();
  const roomFeaturesByRoom = new Map<string, RoomFeature[]>();
  const floorOrder = new Map<string, number>();

  let currentFloorId: string | null = null;
  let currentRoomId: string | null = null;

  for (const e of events as Array<SessionEvent & { payload?: Record<string, unknown> }>) {
    const p = e?.payload ?? {};
    const ts = safeNum(e?.timestamp) ?? Date.now();

    if (e?.type === "FLOOR_INITIALIZED") {
      const floorId = safeStr(p.floorId);
      const floorIndex = safeNum(p.floorIndex);
      if (floorId) {
        floorOrder.set(floorId, floorIndex ?? floorOrder.size);
      }
      continue;
    }

    if (e?.type === "FLOOR_CHANGED") {
      const floorId = safeStr(p.toFloorId) ?? safeStr(p.floorId);
      const roomId = safeStr(p.toRoomId) ?? safeStr(p.roomId);

      if (floorId) currentFloorId = floorId;
      if (roomId) currentRoomId = roomId;
      continue;
    }

    if (e?.type === "ROOM_REVEALED") {
      const floorId = safeStr(p.floorId);
      const roomId = safeStr(p.roomId);
      const roomType = safeStr(p.roomType);

      if (!floorId || !roomId) continue;

      const key = roomKey(floorId, roomId);
      const prev = rooms.get(key);

      rooms.set(key, {
        floorId,
        roomId,
        roomType: roomType ?? prev?.roomType ?? null,
        revealedAt: prev ? Math.min(prev.revealedAt, ts) : ts,
        enteredAt: prev?.enteredAt ?? null,
      });

      if (!floorOrder.has(floorId)) floorOrder.set(floorId, floorOrder.size);
      continue;
    }

    if (e?.type === "ROOM_ENTERED") {
      const floorId = safeStr(p.floorId);
      const roomId = safeStr(p.roomId);
      const roomType = safeStr(p.roomType);

      if (!floorId || !roomId) continue;

      const key = roomKey(floorId, roomId);
      const prev = rooms.get(key);

      rooms.set(key, {
        floorId,
        roomId,
        roomType: roomType ?? prev?.roomType ?? null,
        revealedAt: prev?.revealedAt ?? ts,
        enteredAt: ts,
      });

      currentFloorId = floorId;
      currentRoomId = roomId;

      if (!floorOrder.has(floorId)) floorOrder.set(floorId, floorOrder.size);
      continue;
    }

    if (e?.type === "ROOM_CONNECTION_DISCOVERED") {
      const floorId = safeStr(p.floorId);
      const fromRoomId = safeStr(p.fromRoomId);
      const toRoomId = safeStr(p.toRoomId);
      const connectionId = safeStr(p.connectionId);
      const connectionType = safeStr(p.connectionType) ?? "corridor";

      if (!floorId || !fromRoomId || !toRoomId || !connectionId) continue;

      connections.set(connectionId, {
        connectionId,
        floorId,
        fromRoomId,
        toRoomId,
        connectionType,
        discoveredAt: ts,
      });

      if (!floorOrder.has(floorId)) floorOrder.set(floorId, floorOrder.size);
      continue;
    }

    if (e?.type === "DOOR_DISCOVERED") {
      const floorId = safeStr(p.floorId);
      const roomId = safeStr(p.roomId);
      const connectionId = safeStr(p.connectionId);
      const doorId = safeStr(p.doorId);

      if (!floorId || !roomId || !doorId) continue;

      if (connectionId) {
        const prev = doorByConnectionId.get(connectionId);
        doorByConnectionId.set(connectionId, {
          doorId,
          floorId,
          roomId,
          connectionId,
          locked: Boolean(p.locked) || prev?.locked === true,
          opened: prev?.opened === true,
          note: safeStr(p.note) ?? prev?.note ?? null,
        });
      }
      continue;
    }

    if (e?.type === "DOOR_UNLOCKED" || e?.type === "DOOR_OPENED") {
      const connectionId = safeStr(p.connectionId);
      if (!connectionId) continue;

      const prev = doorByConnectionId.get(connectionId);
      if (!prev) continue;

      doorByConnectionId.set(connectionId, {
        ...prev,
        locked: e.type === "DOOR_UNLOCKED" ? false : prev.locked,
        opened: e.type === "DOOR_OPENED" ? true : prev.opened,
      });
      continue;
    }

    if (e?.type === "ROOM_FEATURE_REVEALED") {
      const floorId = safeStr(p.floorId);
      const roomId = safeStr(p.roomId);
      const featureKind = safeStr(p.featureKind);

      if (!floorId || !roomId || !featureKind) continue;

      const key = roomKey(floorId, roomId);
      const arr = roomFeaturesByRoom.get(key) ?? [];
      if (!arr.some((f) => f.featureKind === featureKind)) {
        arr.push({
          floorId,
          roomId,
          featureKind,
          note: safeStr(p.note) ?? null,
          timestamp: ts,
        });
        roomFeaturesByRoom.set(key, arr);
      }
      continue;
    }

    if (e?.type === "STAIRS_DISCOVERED") {
      const floorId = safeStr(p.floorId);
      const roomId = safeStr(p.roomId);
      if (!floorId || !roomId) continue;

      const key = roomKey(floorId, roomId);
      const arr = roomFeaturesByRoom.get(key) ?? [];
      if (!arr.some((f) => f.featureKind === "stairs")) {
        arr.push({
          floorId,
          roomId,
          featureKind: "stairs",
          note: safeStr(p.direction) ?? null,
          timestamp: ts,
        });
        roomFeaturesByRoom.set(key, arr);
      }
      continue;
    }
  }

  const floorsInOrder = Array.from(floorOrder.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([floorId]) => floorId);

  const activeFloorId =
    currentFloorId ??
    floorsInOrder[0] ??
    Array.from(rooms.values())[0]?.floorId ??
    null;

  const currentFloorRooms = Array.from(rooms.values())
    .filter((room) => room.floorId === activeFloorId)
    .sort((a, b) => a.revealedAt - b.revealedAt);

  const currentFloorConnections = Array.from(connections.values())
    .filter((connection) => connection.floorId === activeFloorId)
    .sort((a, b) => a.discoveredAt - b.discoveredAt);

  const discoveredFeatureCount = Array.from(roomFeaturesByRoom.values()).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  return {
    currentFloorId: activeFloorId,
    currentRoomId,
    floorsInOrder,
    currentFloorRooms,
    currentFloorConnections,
    roomFeaturesByRoom,
    doorByConnectionId,
    discoveredRoomCount: rooms.size,
    discoveredConnectionCount: connections.size,
    discoveredFeatureCount,
  };
}

function buildRoomLayout(
  rooms: RoomGraphRoom[],
  connections: RoomGraphConnection[],
  currentRoomId: string | null
): {
  positionedRooms: PositionedRoom[];
  width: number;
  height: number;
} {
  if (rooms.length === 0) {
    return { positionedRooms: [], width: 0, height: 0 };
  }

  const roomById = new Map<string, RoomGraphRoom>(rooms.map((r) => [r.roomId, r]));
  const adjacency = new Map<string, string[]>();

  for (const room of rooms) adjacency.set(room.roomId, []);

  for (const connection of connections) {
    if (!roomById.has(connection.fromRoomId) || !roomById.has(connection.toRoomId)) continue;
    adjacency.get(connection.fromRoomId)?.push(connection.toRoomId);
    adjacency.get(connection.toRoomId)?.push(connection.fromRoomId);
  }

  const root =
    (currentRoomId && roomById.has(currentRoomId) ? currentRoomId : null) ??
    rooms.find((r) => r.enteredAt !== null)?.roomId ??
    rooms[0]?.roomId;

  const depthById = new Map<string, number>();
  const queue: string[] = [];

  if (root) {
    depthById.set(root, 0);
    queue.push(root);

    while (queue.length > 0) {
      const id = queue.shift()!;
      const depth = depthById.get(id) ?? 0;
      const neighbors = adjacency.get(id) ?? [];

      for (const nextId of neighbors) {
        if (depthById.has(nextId)) continue;
        depthById.set(nextId, depth + 1);
        queue.push(nextId);
      }
    }
  }

  let spillDepth = Math.max(0, ...Array.from(depthById.values()));
  for (const room of rooms) {
    if (!depthById.has(room.roomId)) {
      spillDepth += 1;
      depthById.set(room.roomId, spillDepth);
    }
  }

  const columns = new Map<number, RoomGraphRoom[]>();
  for (const room of rooms) {
    const depth = depthById.get(room.roomId) ?? 0;
    const col = columns.get(depth) ?? [];
    col.push(room);
    columns.set(depth, col);
  }

  const sortedDepths = Array.from(columns.keys()).sort((a, b) => a - b);
  const positionedRooms: PositionedRoom[] = [];

  for (const depth of sortedDepths) {
    const colRooms = (columns.get(depth) ?? []).slice().sort((a, b) => {
      const aScore = a.enteredAt ?? a.revealedAt;
      const bScore = b.enteredAt ?? b.revealedAt;
      return aScore - bScore;
    });

    colRooms.forEach((room, idx) => {
      const x = PAD_X + depth * (NODE_W + COL_GAP);
      const y = PAD_Y + idx * (NODE_H + ROW_GAP) + 12;

      positionedRooms.push({
        ...room,
        x,
        y,
      });
    });
  }

  const maxX = Math.max(...positionedRooms.map((r) => r.x + NODE_W), PAD_X + NODE_W);
  const maxY = Math.max(...positionedRooms.map((r) => r.y + NODE_H), PAD_Y + NODE_H);

  return {
    positionedRooms,
    width: maxX + PAD_X,
    height: maxY + PAD_Y,
  };
}

function LegendChip({ label, swatch }: { label: string; swatch: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {swatch}
      <span className="muted" style={{ fontSize: 12 }}>
        {label}
      </span>
    </span>
  );
}

function IconImg({
  src,
  alt,
  size,
  style,
}: {
  src: string;
  alt: string;
  size: number;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        imageRendering: "auto",
        userSelect: "none",
        ...style,
      }}
    />
  );
}

export default function ExplorationMapPanel({ events, mapW = 13, mapH = 9 }: Props) {
  void mapW;
  void mapH;

  const derived = useMemo(() => deriveGraphState(events), [events]);
  const layout = useMemo(
    () => buildRoomLayout(derived.currentFloorRooms, derived.currentFloorConnections, derived.currentRoomId),
    [derived.currentFloorRooms, derived.currentFloorConnections, derived.currentRoomId]
  );

  const hasMountedRef = useRef(false);
  const lastSnapshotRef = useRef<{
    discoveredRoomCount: number;
    discoveredConnectionCount: number;
    discoveredFeatureCount: number;
    lastEventId: string | null;
  } | null>(null);

  useEffect(() => {
    const lastEventId =
      events.length > 0 ? String((events[events.length - 1] as SessionEvent)?.id ?? "") : null;

    const currentSnapshot = {
      discoveredRoomCount: derived.discoveredRoomCount,
      discoveredConnectionCount: derived.discoveredConnectionCount,
      discoveredFeatureCount: derived.discoveredFeatureCount,
      lastEventId,
    };

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      lastSnapshotRef.current = currentSnapshot;
      return;
    }

    const prev = lastSnapshotRef.current;
    lastSnapshotRef.current = currentSnapshot;
    if (!prev) return;

    const roomsIncreased = currentSnapshot.discoveredRoomCount > prev.discoveredRoomCount;
    const connectionsIncreased = currentSnapshot.discoveredConnectionCount > prev.discoveredConnectionCount;
    const featuresIncreased = currentSnapshot.discoveredFeatureCount > prev.discoveredFeatureCount;
    const eventChanged = currentSnapshot.lastEventId !== prev.lastEventId;

    if (eventChanged && (roomsIncreased || connectionsIncreased || featuresIncreased)) {
      playDiscoveryChime();
    }
  }, [
    events,
    derived.discoveredRoomCount,
    derived.discoveredConnectionCount,
    derived.discoveredFeatureCount,
  ]);

  const playerAsset = assetForPlayer();

  const roomPosById = useMemo(() => {
    return new Map<string, PositionedRoom>(layout.positionedRooms.map((room) => [room.roomId, room]));
  }, [layout.positionedRooms]);

  const currentRoom = derived.currentFloorRooms.find((room) => room.roomId === derived.currentRoomId) ?? null;
  const currentFloorLabel = derived.currentFloorId ? labelForFloor(derived.currentFloorId) : "Unknown Floor";

  return (
    <CardSection title="Exploration Map (Canon View)">
      <p className="muted" style={{ marginTop: 0 }}>
        This map is derived from canon events. Discovery reveals rooms, thresholds, and routes — not abstract tiles.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          margin: "10px 0 12px",
        }}
      >
        <LegendChip
          label="Current Room"
          swatch={
            <span
              style={{
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "1px solid rgba(138,180,255,0.55)",
                background: "rgba(138,180,255,0.14)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              }}
            >
              <IconImg src={playerAsset.src} alt={playerAsset.label} size={14} />
            </span>
          }
        />
        <LegendChip
          label="Discovered Room"
          swatch={
            <span
              aria-hidden
              style={{
                width: 18,
                height: 18,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                display: "inline-block",
              }}
            />
          }
        />
        <LegendChip
          label="Door / Threshold"
          swatch={
            <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>
              🔒
            </span>
          }
        />
        <LegendChip
          label="Stairs / Shrine / Loot / Hazard"
          swatch={
            <span style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 14 }}>
              <span>⇩</span>
              <span>★</span>
              <span>💰</span>
              <span>⚠</span>
            </span>
          }
        />
      </div>

      <div className="muted" style={{ marginBottom: 12 }}>
        Floor: <strong>{currentFloorLabel}</strong>
        {currentRoom ? (
          <>
            {" "}
            · Current Room: <strong>{labelForRoom(currentRoom.roomId, currentRoom.roomType)}</strong>
          </>
        ) : null}
        {" "}
        · Rooms: <strong>{derived.currentFloorRooms.length}</strong>
        {" "}
        · Routes: <strong>{derived.currentFloorConnections.length}</strong>
      </div>

      {layout.positionedRooms.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>No discovered rooms yet.</div>
          <div className="muted" style={{ fontSize: 13 }}>
            Once canon room discovery events are recorded, the dungeon graph will appear here.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "block",
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              "radial-gradient(1200px 420px at 30% 0%, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.30) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.35), 0 18px 40px rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              position: "relative",
              width: Math.max(layout.width, 520),
              height: Math.max(layout.height, 240),
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <svg
              width={Math.max(layout.width, 520)}
              height={Math.max(layout.height, 240)}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              {derived.currentFloorConnections.map((connection) => {
                const from = roomPosById.get(connection.fromRoomId);
                const to = roomPosById.get(connection.toRoomId);
                if (!from || !to) return null;

                const x1 = from.x + NODE_W / 2;
                const y1 = from.y + NODE_H / 2;
                const x2 = to.x + NODE_W / 2;
                const y2 = to.y + NODE_H / 2;

                const door = derived.doorByConnectionId.get(connection.connectionId);
                const isLocked =
                  connection.connectionType === "locked_door" ||
                  door?.locked === true;
                const isOpened = door?.opened === true;
                const isStairs = connection.connectionType === "stairs";
                const isSecret = connection.connectionType === "secret";

                return (
                  <g key={connection.connectionId}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={
                        isLocked
                          ? "rgba(255,196,118,0.62)"
                          : isStairs
                            ? "rgba(138,180,255,0.60)"
                            : isSecret
                              ? "rgba(188,160,255,0.55)"
                              : "rgba(255,255,255,0.24)"
                      }
                      strokeWidth={isLocked || isStairs ? 3 : 2}
                      strokeDasharray={
                        isSecret ? "6 6" : isLocked && !isOpened ? "8 5" : undefined
                      }
                      opacity={0.92}
                    />
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      r={12}
                      fill="rgba(10,10,10,0.82)"
                      stroke="rgba(255,255,255,0.12)"
                    />
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 + 4}
                      textAnchor="middle"
                      fontSize="12"
                      fill="rgba(245,236,216,0.94)"
                    >
                      {isStairs ? "⇩" : isLocked ? "🔒" : isSecret ? "✦" : "•"}
                    </text>
                  </g>
                );
              })}
            </svg>

            {layout.positionedRooms.map((room) => {
              const key = roomKey(room.floorId, room.roomId);
              const features = derived.roomFeaturesByRoom.get(key) ?? [];
              const isCurrent = room.roomId === derived.currentRoomId;

              const roomTitle = labelForRoom(room.roomId, room.roomType);
              const roomTypeLabel = room.roomType ? titleCase(room.roomType) : "Room";

              return (
                <div
                  key={key}
                  title={`${roomTitle} · ${roomTypeLabel}`}
                  style={{
                    position: "absolute",
                    left: room.x,
                    top: room.y,
                    width: NODE_W,
                    height: NODE_H,
                    borderRadius: 16,
                    border: isCurrent
                      ? "1px solid rgba(138,180,255,0.62)"
                      : "1px solid rgba(255,255,255,0.12)",
                    background: isCurrent
                      ? "linear-gradient(180deg, rgba(138,180,255,0.12), rgba(255,255,255,0.05))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                    boxShadow: isCurrent
                      ? "0 0 0 3px rgba(138,180,255,0.10), 0 12px 28px rgba(0,0,0,0.28)"
                      : "0 10px 24px rgba(0,0,0,0.24)",
                    padding: "10px 12px",
                    display: "grid",
                    gap: 8,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: 14,
                          lineHeight: 1.2,
                          color: "rgba(245,236,216,0.96)",
                        }}
                      >
                        {roomTitle}
                      </div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                        {roomTypeLabel}
                      </div>
                    </div>

                    {isCurrent ? (
                      <span
                        aria-hidden
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          border: "1px solid rgba(138,180,255,0.70)",
                          background: "rgba(0,0,0,0.22)",
                          boxShadow: "0 0 0 3px rgba(138,180,255,0.14), 0 0 18px rgba(138,180,255,0.24)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "0 0 auto",
                        }}
                      >
                        <IconImg src={playerAsset.src} alt={playerAsset.label} size={16} />
                      </span>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {features.length > 0 ? (
                      features.slice(0, 4).map((feature, idx) => (
                        <span
                          key={`${feature.featureKind}-${idx}`}
                          title={
                            feature.note
                              ? `${titleCase(feature.featureKind)} — ${feature.note}`
                              : titleCase(feature.featureKind)
                          }
                          style={{
                            minWidth: 22,
                            height: 22,
                            padding: "0 6px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(0,0,0,0.20)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                          }}
                        >
                          {iconForFeature(feature.featureKind)}
                        </span>
                      ))
                    ) : (
                      <span className="muted" style={{ fontSize: 11 }}>
                        No revealed features
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 12,
                pointerEvents: "none",
                background: [
                  "radial-gradient(220px 220px at 20% 18%, rgba(255,190,120,0.10), rgba(255,190,120,0.00) 62%)",
                  "radial-gradient(260px 260px at 82% 24%, rgba(255,200,140,0.08), rgba(255,200,140,0.00) 65%)",
                  "radial-gradient(260px 200px at 52% 58%, rgba(138,180,255,0.06), rgba(138,180,255,0.00) 70%)",
                  "radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0.00) 52%, rgba(0,0,0,0.22) 78%, rgba(0,0,0,0.36) 100%)",
                ].join(", "),
                mixBlendMode: "screen",
                opacity: 0.9,
              }}
            />
          </div>

          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            Discovery reveals places and routes. Locked thresholds, stairs, shrines, hazards, and treasure are remembered on the graph.
          </div>
        </div>
      )}

      {derived.currentFloorRooms.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary className="muted">Show discovered rooms</summary>
          <ul style={{ marginTop: 10 }}>
            {derived.currentFloorRooms.map((room) => {
              const key = roomKey(room.floorId, room.roomId);
              const features = derived.roomFeaturesByRoom.get(key) ?? [];
              return (
                <li key={key} style={{ marginBottom: 8 }}>
                  <strong>{labelForRoom(room.roomId, room.roomType)}</strong>
                  {" — "}
                  {labelForFloor(room.floorId)}
                  {features.length > 0 ? (
                    <>
                      {" · "}
                      {features.map((f) => titleCase(f.featureKind)).join(", ")}
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </CardSection>
  );
}
