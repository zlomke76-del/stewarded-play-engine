"use client";

// ------------------------------------------------------------
// DungeonPressurePanel.tsx
// ------------------------------------------------------------
// Advisory-only dungeon pressure + location inference.
// NO authority, NO mutation, NO automation.
//
// Purpose:
// - Make time, noise, and spatial continuity visible
// - Recommend (never assert) current location
// - Preserve Arbiter authority
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

type Props = {
  turn: number;
  currentRoomId?: string; // canonical room, if any
  events: readonly SessionEvent[];
  parsedCommand?: any; // optional, advisory-only
};

// ------------------------------------------------------------
// Pressure
// ------------------------------------------------------------

function pressureForTurn(turn: number): {
  label: string;
  level: "low" | "rising" | "high" | "critical";
  explanation: string;
  difficultyHint: string;
} {
  if (turn < 5) {
    return {
      label: "Low",
      level: "low",
      explanation: "Minimal time pressure.",
      difficultyHint: "No difficulty bias suggested.",
    };
  }

  if (turn < 10) {
    return {
      label: "Rising",
      level: "rising",
      explanation: "Extended exploration increases risk.",
      difficultyHint:
        "Environmental actions may justify slightly higher difficulty.",
    };
  }

  if (turn < 15) {
    return {
      label: "High",
      level: "high",
      explanation:
        "Dungeon denizens may react to prolonged activity.",
      difficultyHint:
        "Risky or noisy actions may justify higher difficulty.",
    };
  }

  return {
    label: "Critical",
    level: "critical",
    explanation:
      "Sustained presence makes encounters increasingly likely.",
    difficultyHint:
      "All actions may justify elevated difficulty or complications.",
  };
}

// ------------------------------------------------------------
// Alert (with decay)
// ------------------------------------------------------------

function deriveAlertState(
  events: readonly SessionEvent[],
  turn: number
): { status: "Quiet" | "Suspicious" | "Alerted"; explanation: string } {
  const noisy = events
    .filter(
      (e) =>
        e.type === "OUTCOME" &&
        typeof e.payload?.description === "string" &&
        /(attack|fight|smash|break|loud|explode)/i.test(
          e.payload.description
        )
    )
    .map((e) => e.payload?.world?.turn)
    .filter((t): t is number => typeof t === "number");

  if (noisy.length === 0) {
    return {
      status: "Quiet",
      explanation: "No significant noise detected.",
    };
  }

  const lastNoiseTurn = Math.max(...noisy);
  const delta = turn - lastNoiseTurn;

  if (delta >= 6) {
    return {
      status: "Quiet",
      explanation:
        "Earlier disturbances have faded over time.",
    };
  }

  if (delta >= 3) {
    return {
      status: "Suspicious",
      explanation:
        "Earlier disturbances linger but are not fresh.",
    };
  }

  return {
    status: "Alerted",
    explanation:
      "Recent loud or violent activity detected.",
  };
}

// ------------------------------------------------------------
// Location inference (ADVISORY ONLY)
// ------------------------------------------------------------

function recommendLocation(
  parsedCommand?: any
): { id: string; label: string; reason: string } {
  const text =
    parsedCommand?.rawInput?.toLowerCase?.() ?? "";

  if (
    text.includes("open door") ||
    text.includes("enter") ||
    text.includes("hallway") ||
    text.includes("passage")
  ) {
    return {
      id: "room-stone-hallway",
      label: "Stone Hallway",
      reason:
        "Entry or door interaction implies movement into an interior passage.",
    };
  }

  return {
    id: "room-dungeon-entrance",
    label: "Dungeon Entrance",
    reason:
      "No interior movement recorded; default staging location.",
  };
}

// ------------------------------------------------------------
// Persistent world notes (room-scoped)
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
        `Door ${w.lock.state}${
          w.lock.keyId ? ` (Key: ${w.lock.keyId})` : ""
        }`
      );
    }

    if (w.trap) {
      notes.push(`Trap ${w.trap.state}`);
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
  parsedCommand,
}: Props) {
  const pressure = pressureForTurn(turn);
  const alert = deriveAlertState(events, turn);

  const location = useMemo(() => {
    if (currentRoomId) {
      return {
        id: currentRoomId,
        label: currentRoomId,
        canonical: true,
        reason: "Confirmed by recorded canon.",
      };
    }

    const rec = recommendLocation(parsedCommand);
    return { ...rec, canonical: false };
  }, [currentRoomId, parsedCommand]);

  const persistent = derivePersistentWorldState(
    events,
    location.canonical ? location.id : undefined
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

      {/* Location */}
      <p>
        <strong>📍 Current Location:</strong>{" "}
        {location.label}
      </p>
      {!location.canonical && (
        <p className="muted">
          Recommended — not yet confirmed.
          <br />
          Reason: {location.reason}
        </p>
      )}

      <hr />

      {/* Turn / Pressure */}
      <p>
        <strong>Turn:</strong> {turn} ·{" "}
        <strong>Pressure:</strong> {pressure.label}
      </p>
      <p className="muted">{pressure.explanation}</p>
      <p className="muted">
        Difficulty hint: {pressure.difficultyHint}
      </p>

      <hr />

      {/* Alert */}
      <p>
        <strong>Alert Status:</strong> {alert.status}
      </p>
      <p className="muted">{alert.explanation}</p>

      <hr />

      {/* Persistent memory */}
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
