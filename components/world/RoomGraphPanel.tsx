"use client";

// ------------------------------------------------------------
// RoomGraphPanel
// ------------------------------------------------------------
// Advisory-only visual dungeon map
//
// Features:
// - SVG room graph (nodes + edges)
// - Patrol heat overlay
// - Derived ONLY from canon events
// - No mutation, no automation
// ------------------------------------------------------------

import React, { useMemo } from "react";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
};

type RoomNode = {
  id: string;
  heat: number;
  x: number;
  y: number;
  adjacent: string[];
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function heatColor(score: number): string {
  if (score <= 1) return "#2a9d8f";
  if (score <= 3) return "#e9c46a";
  if (score <= 6) return "#f4a261";
  return "#e63946";
}

function deriveRoomGraph(
  events: readonly SessionEvent[],
  turn: number
): RoomNode[] {
  const map = new Map<
    string,
    { heat: number; adjacent: Set<string> }
  >();

  // ----------------------------------------------------------
  // Pass 1: collect rooms + adjacency + heat
  // ----------------------------------------------------------

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;

    const w = e.payload?.world;
    const roomId = w?.roomId;
    if (!roomId) continue;

    if (!map.has(roomId)) {
      map.set(roomId, {
        heat: 0,
        adjacent: new Set<string>(),
      });
    }

    const entry = map.get(roomId)!;

    // adjacency
    if (Array.isArray(w.adjacent)) {
      w.adjacent.forEach((r: string) =>
        entry.adjacent.add(r)
      );
    }

    // noise → heat
    if (
      typeof e.payload?.description === "string" &&
      /(attack|fight|combat|shout|break|smash|explode)/i.test(
        e.payload.description
      )
    ) {
      entry.heat += 3;
    }

    if (w.alert?.level === "suspicious") {
      entry.heat += 1;
    }

    if (w.alert?.level === "alerted") {
      entry.heat += 3;
    }
  }

  // ----------------------------------------------------------
  // Layout (radial, deterministic)
  // ----------------------------------------------------------

  const rooms = Array.from(map.entries());
  const radius = 180;
  const cx = 250;
  const cy = 200;

  return rooms.map(([id, data], i) => {
    const angle =
      (i / Math.max(rooms.length, 1)) * Math.PI * 2;

    return {
      id,
      heat: data.heat,
      adjacent: Array.from(data.adjacent),
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

type Props = {
  events: readonly SessionEvent[];
  turn: number;
};

export default function RoomGraphPanel({
  events,
  turn,
}: Props) {
  const rooms = useMemo(
    () => deriveRoomGraph(events, turn),
    [events, turn]
  );

  const roomIndex = Object.fromEntries(
    rooms.map((r) => [r.id, r])
  );

  return (
    <section className="card">
      <h3>🗺️ Dungeon Map (Advisory)</h3>

      {rooms.length === 0 ? (
        <p className="muted">
          No rooms discovered yet.
        </p>
      ) : (
        <svg
          width={500}
          height={400}
          style={{
            background: "#0d0d0d",
            borderRadius: 6,
          }}
        >
          {/* Edges */}
          {rooms.flatMap((r) =>
            r.adjacent
              .filter((a) => roomIndex[a])
              .map((a) => (
                <line
                  key={`${r.id}-${a}`}
                  x1={r.x}
                  y1={r.y}
                  x2={roomIndex[a].x}
                  y2={roomIndex[a].y}
                  stroke="#444"
                  strokeWidth={1}
                />
              ))
          )}

          {/* Nodes */}
          {rooms.map((r) => (
            <g key={r.id}>
              <circle
                cx={r.x}
                cy={r.y}
                r={16}
                fill={heatColor(r.heat)}
              />
              <text
                x={r.x}
                y={r.y + 30}
                textAnchor="middle"
                fontSize="10"
                fill="#ccc"
              >
                {r.id}
              </text>
            </g>
          ))}
        </svg>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Colors reflect patrol pressure. Connections reflect
        known adjacency only. Advisory — no automation.
      </p>
    </section>
  );
}
