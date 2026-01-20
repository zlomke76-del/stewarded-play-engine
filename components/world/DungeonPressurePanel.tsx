"use client";

// ------------------------------------------------------------
// DungeonPressurePanel.tsx
// ------------------------------------------------------------
// Advisory-only dungeon pressure visualization.
// NO authority, NO mutation, NO dice, NO automation.
//
// Purpose:
// - Make time, noise, and persistence *visible*
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
// Helpers — pure derivations only
// ------------------------------------------------------------

function pressureForTurn(turn: number): {
  label: string;
  level: "low" | "rising" | "high" | "critical";
  explanation: string;
} {
  if (turn < 5) {
    return {
      label: "Low",
      level: "low",
      explanation: "Minimal time pressure.",
    };
  }

  if (turn < 10) {
    return {
      label: "Rising",
      level: "rising",
      explanation: "Extended exploration increases risk.",
    };
  }

  if (turn < 15) {
    return {
      label: "High",
      level: "high",
      explanation: "Dungeon denizens may react to prolonged activity.",
    };
  }

  return {
    label: "Critical",
    level: "critical",
    explanation: "Sustained presence makes encounters increasingly likely.",
  };
}

function deriveAlertState(events: readonly SessionEvent[]) {
  const noisy = events.filter(
    (e) =>
      e.type === "OUTCOME" &&
      typeof e.payload?.description === "string" &&
      /(attack|fight|smash|break|loud|explode)/i.test(
        e.payload.description
      )
  );

  if (noisy.length === 0) {
    return {
      status: "Quiet",
      explanation: "No significant noise detected.",
    };
  }

  const last = noisy.at(-1);

  return {
    status: "Alerted",
    explanation: last?.payload?.description ?? "Recent noisy activity.",
  };
}

function wanderingMonsterAdvisory(
  turn: number,
  alertStatus: string
): { show: boolean; reason: string } {
  if (turn >= 10 && alertStatus === "Alerted") {
    return {
      show: true,
      reason:
        "Extended time combined with elevated alert level suggests a wandering monster check.",
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
        `Door ${w.lock.state === "locked" ? "locked" : "unlocked"}${
          w.lock.keyId ? ` (Key: ${w.lock.keyId})` : ""
        }`
      );
    }

    if (w.trap) {
      notes.push(
        `Trap ${
          w.trap.state === "sprung" ? "sprung" : "armed"
        }`
      );
    }
  });

  return notes;
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
  const alert = deriveAlertState(events);
  const wandering = wanderingMonsterAdvisory(
    turn,
    alert.status
  );
  const persistent = derivePersistentWorldState(
    events,
    currentRoomId
  );

  return (
    <section
      className="card"
      style={{
        borderLeft: "4px solid #666",
        background: "#111",
      }}
    >
      <h3>🧭 Dungeon Pressure (Advisory)</h3>

      {/* Turn Pressure */}
      <p>
        <strong>Turn:</strong> {turn} ·{" "}
        <strong>Pressure:</strong>{" "}
        <span>{pressure.label}</span>
      </p>
      <p className="muted">{pressure.explanation}</p>

      <hr />

      {/* Alert State */}
      <p>
        <strong>Alert Status:</strong> {alert.status}
      </p>
      <p className="muted">{alert.explanation}</p>

      <hr />

      {/* Wandering Monsters */}
      {wandering.show ? (
        <>
          <p>
            <strong>Wandering Monsters:</strong>{" "}
            Check recommended
          </p>
          <p className="muted">{wandering.reason}</p>
          <hr />
        </>
      ) : (
        <>
          <p>
            <strong>Wandering Monsters:</strong>{" "}
            Unlikely at present
          </p>
          <hr />
        </>
      )}

      {/* Persistent World State */}
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
