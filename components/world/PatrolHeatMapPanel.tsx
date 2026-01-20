"use client";

// ------------------------------------------------------------
// PatrolHeatMapPanel
// ------------------------------------------------------------
// Advisory-only patrol / danger visualization
//
// Purpose:
// - Show which rooms are becoming dangerous over time
// - Reflect noise, alerts, and prolonged presence
// - Decay naturally if no new activity occurs
//
// NO authority
// NO mutation
// NO automation
// ------------------------------------------------------------

import React, { useMemo } from "react";

// ------------------------------------------------------------
// Types (minimal, compatible)
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  timestamp?: number;
  payload?: any;
};

type Props = {
  events: readonly SessionEvent[];
  currentRoomId?: string;
};

// ------------------------------------------------------------
// Heat model
// ------------------------------------------------------------

type HeatLevel = 0 | 1 | 2 | 3 | 4;

type RoomHeat = {
  roomId: string;
  heat: HeatLevel;
  reasons: string[];
};

// ------------------------------------------------------------
// Helpers — pure derivation
// ------------------------------------------------------------

function heatColor(level: HeatLevel): string {
  switch (level) {
    case 0:
      return "#2a2a2a";
    case 1:
      return "#355f2e";
    case 2:
      return "#9c7c1c";
    case 3:
      return "#c44d1a";
    case 4:
      return "#c1121f";
    default:
      return "#2a2a2a";
  }
}

function deriveRoomHeat(
  events: readonly SessionEvent[]
): RoomHeat[] {
  const map = new Map<string, RoomHeat>();

  events.forEach((e, index) => {
    if (e.type !== "OUTCOME") return;

    const w = e.payload?.world;
    if (!w?.roomId) return;

    if (!map.has(w.roomId)) {
      map.set(w.roomId, {
        roomId: w.roomId,
        heat: 0,
        reasons: [],
      });
    }

    const entry = map.get(w.roomId)!;

    // --- Noise-based heat ---
    if (
      typeof e.payload?.description === "string" &&
      /(attack|fight|smash|break|loud|explode)/i.test(
        e.payload.description
      )
    ) {
      entry.heat = Math.min(
        4,
        (entry.heat + 2) as HeatLevel
      );
      entry.reasons.push("Noisy activity");
    }

    // --- Alert-based heat ---
    if (w.alert?.level === "alerted") {
      entry.heat = Math.min(
        4,
        (entry.heat + 1) as HeatLevel
      );
      entry.reasons.push("Alert propagated");
    }

    // --- Repeated presence heat ---
    if (index > 0) {
      entry.heat = Math.min(
        4,
        (entry.heat + 1) as HeatLevel
      );
      entry.reasons.push("Repeated activity");
    }
  });

  // --- Natural decay pass ---
  map.forEach((entry) => {
    if (entry.reasons.length === 0) {
      entry.heat = Math.max(
        0,
        (entry.heat - 1) as HeatLevel
      );
    }
  });

  return Array.from(map.values());
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function PatrolHeatMapPanel({
  events,
  currentRoomId,
}: Props) {
  const rooms = useMemo(
    () => deriveRoomHeat(events),
    [events]
  );

  return (
    <section className="card">
      <h3>🔥 Patrol Heat Map (Advisory)</h3>

      {rooms.length === 0 ? (
        <p className="muted">
          No rooms have accumulated patrol pressure.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {rooms.map((r) => {
            const isCurrent =
              currentRoomId === r.roomId;

            return (
              <li
                key={r.roomId}
                style={{
                  marginBottom: 8,
                  padding: 8,
                  borderRadius: 4,
                  background: heatColor(r.heat),
                  outline: isCurrent
                    ? "2px solid #ffd166"
                    : undefined,
                }}
              >
                <strong>{r.roomId}</strong>{" "}
                {isCurrent && (
                  <span className="muted">
                    (current room)
                  </span>
                )}
                <br />
                <span className="muted">
                  Danger level: {r.heat}/4
                </span>

                {r.reasons.length > 0 && (
                  <ul
                    className="muted"
                    style={{ marginTop: 4 }}
                  >
                    {Array.from(
                      new Set(r.reasons)
                    ).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Heat represents patrol likelihood — Arbiter
        determines encounters.
      </p>
    </section>
  );
}
