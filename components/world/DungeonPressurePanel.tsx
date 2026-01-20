"use client";

// ------------------------------------------------------------
// DungeonAwarenessPanel
// ------------------------------------------------------------
// Advisory-only dungeon intelligence layer
//
// Purpose:
// - Visualize dungeon state without authority
// - Make pressure, memory, and risk legible
// - Support Arbiter judgment (not replace it)
//
// NO mutation
// NO automation
// NO dice
// ------------------------------------------------------------

import React from "react";

// ------------------------------------------------------------
// Types (minimal, compatible)
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
};

type Props = {
  turn: number;
  events: readonly SessionEvent[];
  currentRoomId?: string;
};

// ------------------------------------------------------------
// Helpers — PURE DERIVATIONS
// ------------------------------------------------------------

function pressureForTurn(turn: number) {
  if (turn < 5)
    return {
      tier: "Low",
      bias: "+0 DC",
      note: "Early exploration. Minimal resistance.",
    };

  if (turn < 10)
    return {
      tier: "Rising",
      bias: "+1–2 DC",
      note: "Extended activity increases friction.",
    };

  if (turn < 15)
    return {
      tier: "High",
      bias: "+3–4 DC",
      note: "Dungeon denizens likely reacting.",
    };

  return {
    tier: "Critical",
    bias: "+5 DC or narrative escalation",
    note: "Sustained presence attracts danger.",
  };
}

function deriveAlert(events: readonly SessionEvent[]) {
  const noisy = events.filter(
    (e) =>
      e.type === "OUTCOME" &&
      typeof e.payload?.description === "string" &&
      /(attack|fight|smash|break|shout|explode|alarm)/i.test(
        e.payload.description
      )
  );

  if (noisy.length === 0) {
    return { level: "Quiet", decay: "Stable" };
  }

  const lastTurn = noisy.length;
  return {
    level: "Alerted",
    decay:
      lastTurn > 3
        ? "Fading if no further noise"
        : "Fresh disturbance",
  };
}

function deriveRooms(events: readonly SessionEvent[]) {
  const rooms = new Set<string>();

  events.forEach((e) => {
    const roomId = e.payload?.world?.roomId;
    if (typeof roomId === "string") rooms.add(roomId);
  });

  return Array.from(rooms);
}

function deriveLocks(events: readonly SessionEvent[]) {
  return events
    .map((e) => e.payload?.world)
    .filter(Boolean)
    .filter((w: any) => w.lock)
    .map((w: any) => ({
      roomId: w.roomId,
      state: w.lock.state,
      keyId: w.lock.keyId,
    }));
}

function deriveTraps(events: readonly SessionEvent[]) {
  return events
    .map((e) => e.payload?.world)
    .filter(Boolean)
    .filter((w: any) => w.trap)
    .map((w: any) => ({
      roomId: w.roomId,
      trapId: w.trap.id,
      state: w.trap.state,
    }));
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function DungeonAwarenessPanel({
  turn,
  events,
  currentRoomId,
}: Props) {
  const pressure = pressureForTurn(turn);
  const alert = deriveAlert(events);
  const rooms = deriveRooms(events);
  const locks = deriveLocks(events);
  const traps = deriveTraps(events);

  return (
    <section
      className="card"
      style={{
        borderLeft: "4px solid #555",
        background: "#111",
      }}
    >
      <h3>🧭 Dungeon Awareness (Advisory)</h3>

      {/* PRESSURE */}
      <p>
        <strong>Turn:</strong> {turn} ·{" "}
        <strong>Pressure:</strong> {pressure.tier}
      </p>
      <p className="muted">
        Difficulty bias hint: {pressure.bias}
      </p>
      <p className="muted">{pressure.note}</p>

      <hr />

      {/* ALERT */}
      <p>
        <strong>Alert State:</strong> {alert.level}
      </p>
      <p className="muted">
        Alert decay: {alert.decay}
      </p>

      <hr />

      {/* ROOMS */}
      <p>
        <strong>Known Rooms:</strong>
      </p>

      {rooms.length === 0 ? (
        <p className="muted">No rooms recorded yet.</p>
      ) : (
        <ul>
          {rooms.map((r) => (
            <li key={r}>
              {r === currentRoomId ? "📍 " : ""}
              {r}
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* LOCKS */}
      <p>
        <strong>Locks:</strong>
      </p>

      {locks.length === 0 ? (
        <p className="muted">No known locked doors.</p>
      ) : (
        <ul>
          {locks.map((l, i) => (
            <li key={i}>
              Room {l.roomId}: {l.state}
              {l.keyId ? ` (Key: ${l.keyId})` : ""}
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* TRAPS */}
      <p>
        <strong>Traps:</strong>
      </p>

      {traps.length === 0 ? (
        <p className="muted">No known traps.</p>
      ) : (
        <ul>
          {traps.map((t, i) => (
            <li key={i}>
              Room {t.roomId}: Trap {t.trapId} ({t.state})
            </li>
          ))}
        </ul>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Advisory only — Arbiter retains full authority.
      </p>
    </section>
  );
}
