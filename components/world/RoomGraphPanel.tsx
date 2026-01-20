"use client";

// ------------------------------------------------------------
// RoomGraphPanel
// ------------------------------------------------------------
// Advisory-only dungeon room graph visualization
//
// Purpose:
// - Visualize discovered rooms
// - Show inferred connections
// - Highlight current location
//
// NO mutation
// NO automation
// NO authority
// ------------------------------------------------------------

import React, { useMemo } from "react";

// ------------------------------------------------------------
// Types (minimal, compatible)
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
};

type Props = {
  events: readonly SessionEvent[];
  currentRoomId?: string;
};

// ------------------------------------------------------------
// Helpers — pure inference
// ------------------------------------------------------------

type RoomNode = {
  id: string;
};

type RoomEdge = {
  from: string;
  to: string;
};

function inferRoomsAndEdges(
  events: readonly SessionEvent[]
): {
  rooms: RoomNode[];
  edges: RoomEdge[];
} {
  const rooms = new Set<string>();
  const edges: RoomEdge[] = [];

  let lastRoom: string | null = null;

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;

    const roomId = e.payload?.world?.roomId;
    if (typeof roomId !== "string") return;

    rooms.add(roomId);

    if (lastRoom && lastRoom !== roomId) {
      edges.push({ from: lastRoom, to: roomId });
    }

    lastRoom = roomId;
  });

  return {
    rooms: Array.from(rooms).map((id) => ({ id })),
    edges,
  };
}

// Simple circular layout (stable, deterministic)
function layoutRooms(rooms: RoomNode[]) {
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  return rooms.map((room, i) => {
    const angle = (2 * Math.PI * i) / rooms.length;
    return {
      ...room,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function RoomGraphPanel({
  events,
  currentRoomId,
}: Props) {
  const { rooms, edges } = useMemo(
    () => inferRoomsAndEdges(events),
    [events]
  );

  const positioned = useMemo(
    () => layoutRooms(rooms),
    [rooms]
  );

  if (rooms.length === 0) {
    return (
      <section className="card">
        <h3>🗺️ Dungeon Map</h3>
        <p className="muted">No rooms discovered yet.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h3>🗺️ Dungeon Map (Advisory)</h3>

      <svg
        width={300}
        height={300}
        style={{
          border: "1px solid #333",
          background: "#0b0b0b",
        }}
      >
        {/* Edges */}
        {edges.map((e, i) => {
          const from = positioned.find(
            (r) => r.id === e.from
          );
          const to = positioned.find(
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
              stroke="#444"
              strokeWidth={2}
            />
          );
        })}

        {/* Nodes */}
        {positioned.map((r) => {
          const isCurrent = r.id === currentRoomId;

          return (
            <g key={r.id}>
              <circle
                cx={r.x}
                cy={r.y}
                r={isCurrent ? 14 : 10}
                fill={isCurrent ? "#ffd166" : "#888"}
                stroke="#222"
                strokeWidth={2}
              />
              <text
                x={r.x}
                y={r.y + 28}
                fontSize="10"
                fill="#aaa"
                textAnchor="middle"
              >
                {r.id}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="muted" style={{ marginTop: 8 }}>
        Map inferred from canon · Connections are heuristic
      </p>
    </section>
  );
}
