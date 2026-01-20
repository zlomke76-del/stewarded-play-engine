"use client";

// ------------------------------------------------------------
// DungeonPressurePanel.tsx
// ------------------------------------------------------------
// Advisory-only dungeon pressure visualization.
// NO authority, NO mutation, NO dice, NO automation.
//
// Purpose:
// - Make time, noise, light, and persistence visible
// - Preserve Arbiter authority
// - Support classic dungeon-crawl tension (Might & Magic style)
// ------------------------------------------------------------

import React from "react";

// ------------------------------------------------------------
// Types (minimal + compatible)
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
};

type Props = {
  turn: number;
  currentRoomId?: string;
  events: readonly SessionEvent[];
};

// ------------------------------------------------------------
// Pressure (time)
// ------------------------------------------------------------

function pressureForTurn(turn: number) {
  if (turn < 5) {
    return {
      label: "Low",
      level: "low" as const,
      explanation: "Minimal time pressure.",
      bias: "No difficulty bias recommended.",
    };
  }

  if (turn < 10) {
    return {
      label: "Rising",
      level: "rising" as const,
      explanation: "Extended exploration increases risk.",
      bias: "Consider +1–2 DC for cautious actions.",
    };
  }

  if (turn < 15) {
    return {
      label: "High",
      level: "high" as const,
      explanation: "Dungeon denizens may react to prolonged activity.",
      bias: "Consider +2–4 DC for risky actions.",
    };
  }

  return {
    label: "Critical",
    level: "critical" as const,
    explanation: "Sustained presence makes encounters increasingly likely.",
    bias: "Strong bias: complications even on success.",
  };
}

// ------------------------------------------------------------
// Alert state + decay
// ------------------------------------------------------------

function deriveAlertState(events: readonly SessionEvent[]) {
  const noisyEvents = events.filter(
    (e) =>
      e.type === "OUTCOME" &&
      typeof e.payload?.description === "string" &&
      /(attack|fight|smash|break|loud|explode)/i.test(
        e.payload.description
      )
  );

  if (noisyEvents.length === 0) {
    return {
      status: "Quiet",
      explanation: "No significant noise detected.",
      lastNoiseTurn: null,
    };
  }

  const last = noisyEvents.at(-1);
  const lastTurn = last?.payload?.world?.turn ?? null;

  return {
    status: "Alerted",
    explanation: "Recent loud activity has drawn attention.",
    lastNoiseTurn: lastTurn,
  };
}

function alertDecay(
  currentTurn: number,
  lastNoiseTurn: number | null
) {
  if (lastNoiseTurn === null) return "Quiet";

  const delta = currentTurn - lastNoiseTurn;

  if (delta <= 2) return "Alerted";
  if (delta <= 5) return "Suspicious";
  return "Quiet";
}

// ------------------------------------------------------------
// Wandering monster advisory
// ------------------------------------------------------------

function wanderingMonsterAdvisory(
  turn: number,
  alertLevel: string
) {
  if (alertLevel === "Alerted" && turn >= 8) {
    return {
      show: true,
      reason:
        "High alert combined with elapsed time suggests a wandering monster check.",
    };
  }

  if (turn >= 12) {
    return {
      show: true,
      reason:
        "Extended exploration time alone may justify a wandering monster check.",
    };
  }

  return { show: false, reason: "" };
}

// ------------------------------------------------------------
// Persistent room memory
// ------------------------------------------------------------

function derivePersistentWorldState(
  events: readonly SessionEvent[],
  roomId?: string
): string[] {
  const notes: string[] = [];

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;
    const w = e.payload?.world;
    if (!w) return;

    if (roomId && w.roomId && w.roomId !== roomId) return;

    if (w.lock) {
      notes.push(
        `Door ${w.lock.state === "locked" ? "locked" : "unlocked"}`
      );
    }

    if (w.trap) {
      notes.push(`Trap ${w.trap.state}`);
    }
  });

  return notes;
}

// ------------------------------------------------------------
// Light / torch tracking
// ------------------------------------------------------------

function deriveLightState(turn: number) {
  const TORCH_DURATION = 6; // classic approximation
  const remaining = TORCH_DURATION - (turn % TORCH_DURATION);

  if (remaining <= 1) {
    return {
      status: "Flickering",
      explanation:
        "Light source nearly exhausted. Darkness imminent.",
    };
  }

  if (remaining <= 3) {
    return {
      status: "Dim",
      explanation: "Light is weakening. Shadows deepen.",
    };
  }

  return {
    status: "Bright",
    explanation: "Adequate light maintained.",
  };
}

// ------------------------------------------------------------
// Adjacency awareness (heuristic)
// ------------------------------------------------------------

function adjacencyAdvisory(alertLevel: string) {
  if (alertLevel === "Alerted") {
    return "Noise may have propagated to adjacent rooms.";
  }

  if (alertLevel === "Suspicious") {
    return "Nearby rooms may be aware of unusual activity.";
  }

  return "No signs of attention from adjacent rooms.";
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function DungeonPressurePanel({
  turn,
  currentRoomId,
  events,
}: Props) {
  const pressure = pressureForTurn(turn);

  const rawAlert = deriveAlertState(events);
  const alertLevel = alertDecay(turn, rawAlert.lastNoiseTurn);

  const wandering = wanderingMonsterAdvisory(
    turn,
    alertLevel
  );

  const persistent = derivePersistentWorldState(
    events,
    currentRoomId
  );

  const light = deriveLightState(turn);
  const adjacency = adjacencyAdvisory(alertLevel);

  return (
    <section className="card" style={{ borderLeft: "4px solid #666" }}>
      <h3>🧭 Dungeon Pressure (Advisory)</h3>

      <p>
        <strong>Turn:</strong> {turn} ·{" "}
        <strong>Pressure:</strong> {pressure.label}
      </p>
      <p className="muted">{pressure.explanation}</p>
      <p className="muted">
        <strong>Bias hint:</strong> {pressure.bias}
      </p>

      <hr />

      <p>
        <strong>Alert Level:</strong> {alertLevel}
      </p>
      <p className="muted">{rawAlert.explanation}</p>
      <p className="muted">{adjacency}</p>

      <hr />

      <p>
        <strong>Light:</strong> {light.status}
      </p>
      <p className="muted">{light.explanation}</p>

      <hr />

      {wandering.show ? (
        <>
          <p>
            <strong>Wandering Monsters:</strong> Check recommended
          </p>
          <p className="muted">{wandering.reason}</p>
          <hr />
        </>
      ) : (
        <>
          <p>
            <strong>Wandering Monsters:</strong> Unlikely
          </p>
          <hr />
        </>
      )}

      <p>
        <strong>Environmental Memory:</strong>
      </p>

      {persistent.length === 0 ? (
        <p className="muted">
          No notable persistent changes in this area.
        </p>
      ) : (
        <ul>
          {persistent.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Advisory only — Arbiter determines all outcomes.
      </p>
    </section>
  );
}
