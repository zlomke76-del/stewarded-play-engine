"use client";

// ------------------------------------------------------------
// DungeonPressurePanel (Advisory Only)
// ------------------------------------------------------------
// Purpose:
// - Aggregate dungeon risk from canon
// - No authority, no mutation
// - Explains WHY pressure is rising
// ------------------------------------------------------------

import { useMemo } from "react";

type Props = {
  events: readonly {
    type: string;
    payload: any;
  }[];
};

// ------------------------------------------------------------
// Pressure evaluation
// ------------------------------------------------------------

type PressureTier = "Calm" | "Tense" | "Dangerous" | "Critical";

function evaluatePressure(events: Props["events"]) {
  let turn = 0;
  let activeTraps = 0;
  let alertedRooms = 0;
  let lockedDoors = 0;

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;

    const world = e.payload?.world;
    if (!world) continue;

    if (typeof world.turn === "number") {
      turn = Math.max(turn, world.turn);
    }

    if (world.trap?.state === "armed") activeTraps++;
    if (world.alert?.level === "alerted") alertedRooms++;
    if (world.lock?.state === "locked") lockedDoors++;
  }

  let tier: PressureTier = "Calm";
  const reasons: string[] = [];

  if (turn >= 5) {
    tier = "Tense";
    reasons.push("Time spent in dungeon");
  }

  if (activeTraps > 0) {
    tier = "Tense";
    reasons.push(`${activeTraps} armed trap(s)`);
  }

  if (alertedRooms > 0) {
    tier = "Dangerous";
    reasons.push(`${alertedRooms} room(s) on alert`);
  }

  if (turn >= 10 || alertedRooms >= 2) {
    tier = "Critical";
    reasons.push("Escalating monster activity");
  }

  return {
    tier,
    turn,
    activeTraps,
    alertedRooms,
    lockedDoors,
    reasons,
  };
}

// ------------------------------------------------------------

export default function DungeonPressurePanel({ events }: Props) {
  const pressure = useMemo(
    () => evaluatePressure(events),
    [events]
  );

  return (
    <section
      style={{
        border: "1px solid #444",
        borderRadius: 6,
        padding: 16,
        marginTop: 16,
        background: "#0f1a2a",
      }}
    >
      <h3>Dungeon Pressure</h3>

      <p>
        <strong>Status:</strong>{" "}
        <span
          style={{
            color:
              pressure.tier === "Calm"
                ? "#9f9"
                : pressure.tier === "Tense"
                ? "#ff9"
                : pressure.tier === "Dangerous"
                ? "#f99"
                : "#f55",
          }}
        >
          {pressure.tier}
        </span>
      </p>

      <ul style={{ marginTop: 8 }}>
        <li>Turn: {pressure.turn}</li>
        <li>Armed traps: {pressure.activeTraps}</li>
        <li>Locked doors: {pressure.lockedDoors}</li>
        <li>Alerted rooms: {pressure.alertedRooms}</li>
      </ul>

      {pressure.reasons.length > 0 && (
        <>
          <p className="muted" style={{ marginTop: 8 }}>
            Contributing factors:
          </p>
          <ul>
            {pressure.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Advisory only. No outcomes are enforced.
      </p>
    </section>
  );
}
