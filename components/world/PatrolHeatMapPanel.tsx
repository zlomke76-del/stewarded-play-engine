"use client";

// ------------------------------------------------------------
// PatrolHeatMapPanel
// ------------------------------------------------------------
// Advisory-only patrol / danger heat overlay by room
//
// FIXED:
// - Numeric heat score separated from HeatLevel enum
// - No invalid number → HeatLevel assignments
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

type HeatLevel = "cold" | "warm" | "hot" | "danger";

type RoomHeat = {
  roomId: string;
  score: number; // numeric only
  level: HeatLevel;
  lastTurn: number;
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function heatLevelFromScore(score: number): HeatLevel {
  if (score <= 1) return "cold";
  if (score <= 3) return "warm";
  if (score <= 6) return "hot";
  return "danger";
}

function colorForHeat(level: HeatLevel): string {
  switch (level) {
    case "cold":
      return "#2a9d8f";
    case "warm":
      return "#e9c46a";
    case "hot":
      return "#f4a261";
    case "danger":
      return "#e63946";
  }
}

// ------------------------------------------------------------
// Core derivation (PURE)
// ------------------------------------------------------------

function derivePatrolHeat(
  events: readonly SessionEvent[],
  currentTurn: number
): RoomHeat[] {
  const map = new Map<string, { score: number; lastTurn: number }>();

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;

    const world = e.payload?.world;
    const roomId = world?.roomId;
    if (!roomId) continue;

    if (!map.has(roomId)) {
      map.set(roomId, { score: 0, lastTurn: currentTurn });
    }

    const entry = map.get(roomId)!;

    // ---- Noise & combat ----
    if (
      typeof e.payload?.description === "string" &&
      /(attack|fight|combat|shout|smash|break|explode)/i.test(
        e.payload.description
      )
    ) {
      entry.score += 3;
    }

    // ---- Alert escalation ----
    if (world.alert?.level === "suspicious") {
      entry.score += 1;
    }

    if (world.alert?.level === "alerted") {
      entry.score += 3;
    }

    entry.lastTurn = world.turn ?? currentTurn;
  }

  // ---- Decay over time ----
  const results: RoomHeat[] = [];

  for (const [roomId, entry] of map.entries()) {
    const age = currentTurn - entry.lastTurn;
    const decayedScore = Math.max(
      0,
      entry.score - Math.floor(age / 3)
    );

    results.push({
      roomId,
      score: decayedScore,
      level: heatLevelFromScore(decayedScore),
      lastTurn: entry.lastTurn,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

type Props = {
  events: readonly SessionEvent[];
  turn: number;
};

export default function PatrolHeatMapPanel({
  events,
  turn,
}: Props) {
  const heat = useMemo(
    () => derivePatrolHeat(events, turn),
    [events, turn]
  );

  return (
    <section className="card">
      <h3>🔥 Patrol Heat (Advisory)</h3>

      {heat.length === 0 ? (
        <p className="muted">
          No patrol pressure detected yet.
        </p>
      ) : (
        <ul>
          {heat.map((r) => (
            <li
              key={r.roomId}
              style={{ color: colorForHeat(r.level) }}
            >
              <strong>{r.roomId}</strong> ·{" "}
              {r.level.toUpperCase()}{" "}
              <span className="muted">
                (score {r.score}, last activity{" "}
                {turn - r.lastTurn} turns ago)
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Heat reflects time, noise, and alerts.
        Advisory only — Arbiter determines encounters
        and patrol behavior.
      </p>
    </section>
  );
}
