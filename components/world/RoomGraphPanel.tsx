"use client";

// ------------------------------------------------------------
// RoomGraphPanel
// ------------------------------------------------------------
// Advisory-only dungeon room graph visualization
//
// Purpose:
// - Show explored rooms and connections
// - Visualize locks, traps, alerts
// - Highlight current position
//
// NO mutation
// NO automation
// NO authority
// ------------------------------------------------------------

import React, { useMemo } from "react";

// ------------------------------------------------------------
// Types (minimal + compatible)
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
};

type RoomNode = {
  id: string;
  label: string;
  locked?: boolean;
  trap?: "armed" | "sprung" | "disarmed";
  alert?: "none" | "suspicious" | "alerted";
};

type RoomEdge = {
  from: string;
  to: string;
  locked?: boolean;
};

type Props = {
  events: readonly SessionEvent[];
  currentRoomId?: string;
};

// ------------------------------------------------------------
// Helpers — pure derivation
// ------------------------------------------------------------

function deriveRoomsAndEdges(
  events: readonly SessionEvent[]
): { rooms: RoomNode[]; edges: RoomEdge[] } {
  const rooms = new Map<string, RoomNode>();
  const edges: RoomEdge[] = [];

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;

    const w = e.payload?.world;
    if (!w?.roomId) return;

    // --- Room creation ---
    if (!rooms.has(w.roomId)) {
      rooms.set(w.roomId, {
        id: w.roomId,
        label: w.roomId,
        alert: "none",
      });
    }

    const room = rooms.get(w.roomId)!;

    // --- Lock state ---
    if (w.lock) {
      room.locked = w.lock.state === "locked";
    }

    // --- Trap state ---
    if (w.trap) {
      room.trap = w.trap.state;
    }

    // --- Alert state ---
    if (w.alert?.level) {
      room.alert = w.alert.level;
    }

    // --- Connection inference ---
    if (w.primary === "move" && w.fromRoomId) {
      edges.push({
        from: w.fromRoomId,
        to: w.roomId,
        locked: room.locked,
      });
    }
  });

  return {
    rooms: Array.from(rooms.values()),
    edges,
  };
}

// ------------------------------------------------------------
// Layout — simple radial placement
// ------------------------------------------------------------

function layoutRooms(rooms: RoomNode[]) {
  const radius = 140;
  const center = { x: 200, y: 200 };

  return rooms.map((room, i) => {
    const angle = (i / rooms.length) * Math.PI * 2;
    return {
      ...room,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
}

// ------------------------------------------------------------
// Visual helpers
// ------------------------------------------------------------

function roomColor(room: RoomNode) {
  if (room.alert === "alerted") return "#c1121f";
  if (room.alert === "suspicious") return "#e09f3e";
  if (room.trap === "sprung") return "#9c6644";
  if (room.locked) return "#495057";
  return "#2a9d8f";
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function RoomGraphPanel({
  events,
  currentRoomId,
}: Props) {
  const { rooms, edges } = useMemo(
    () => deriveRoomsAndEdges(events),
    [events]
  );

  const positionedRooms = useMemo(
    () => layoutRooms(rooms),
    [rooms]
  );

  if (rooms.length === 0) {
    return (
      <section className="card">
        <h3>🗺️ Dungeon Map</h3>
        <p className="muted">
          No rooms discovered yet.
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h3>🗺️ Dungeon Map (Advisory)</h3>

      <svg
        width={400}
        height={400}
        style={{
          background: "#0b0b0b",
          borderRadius: 6,
        }}
      >
        {/* Edges */}
        {edges.map((e, i) => {
          const from = positionedRooms.find(
            (r) => r.id === e.from
          );
          const to = positionedRooms.find(
            (r) => r.id === e.to
          );
          if (!from || !to) return null;

          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={e.locked ? "#888" : "#555"}
              strokeDasharray={
                e.locked ? "4 2" : undefined
              }
            />
          );
        })}

        {/* Nodes */}
        {positionedRooms.map((room) => {
          const isCurrent =
            room.id === currentRoomId;

          return (
            <g key={room.id}>
              <circle
                cx={room.x}
                cy={room.y}
                r={18}
                fill={roomColor(room)}
                stroke={
                  isCurrent ? "#ffd166" : "#000"
                }
                strokeWidth={isCurrent ? 3 : 1}
              />
              <text
                x={room.x}
                y={room.y + 32}
                textAnchor="middle"
                fontSize="10"
                fill="#ddd"
              >
                {room.label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="muted" style={{ marginTop: 8 }}>
        Map shows discovered rooms and inferred
        connections. Locked paths and alert states
        are advisory only.
      </p>
    </section>
  );
}
