"use client";

// ------------------------------------------------------------
// KeyDoorPanel
// ------------------------------------------------------------
// Advisory-only key inventory & door matching
//
// Purpose:
// - Show keys acquired by the party
// - Show doors encountered (locked / unlocked)
// - Indicate potential key-door matches
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
// Helpers — pure canon derivation
// ------------------------------------------------------------

type KeyInfo = {
  keyId: string;
  source?: string;
};

type DoorInfo = {
  roomId?: string;
  state: "locked" | "unlocked";
  keyId?: string;
};

function deriveKeys(events: readonly SessionEvent[]): KeyInfo[] {
  const keys = new Map<string, KeyInfo>();

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;

    const w = e.payload?.world;
    if (!w?.lock?.keyId) return;

    if (w.lock.state === "unlocked") {
      keys.set(w.lock.keyId, {
        keyId: w.lock.keyId,
        source: w.roomId,
      });
    }
  });

  return Array.from(keys.values());
}

function deriveDoors(
  events: readonly SessionEvent[]
): DoorInfo[] {
  const doors: DoorInfo[] = [];

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;

    const w = e.payload?.world;
    if (!w?.lock) return;

    doors.push({
      roomId: w.roomId,
      state: w.lock.state,
      keyId: w.lock.keyId,
    });
  });

  return doors;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function KeyDoorPanel({
  events,
  currentRoomId,
}: Props) {
  const keys = useMemo(() => deriveKeys(events), [
    events,
  ]);
  const doors = useMemo(() => deriveDoors(events), [
    events,
  ]);

  return (
    <section className="card">
      <h3>🗝️ Keys & Doors (Advisory)</h3>

      {/* ---------- KEYS ---------- */}
      <h4>Party Keys</h4>

      {keys.length === 0 ? (
        <p className="muted">No keys acquired.</p>
      ) : (
        <ul>
          {keys.map((k) => (
            <li key={k.keyId}>
              <strong>{k.keyId}</strong>
              {k.source && (
                <span className="muted">
                  {" "}
                  (from {k.source})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* ---------- DOORS ---------- */}
      <h4>Known Doors</h4>

      {doors.length === 0 ? (
        <p className="muted">
          No locked doors encountered.
        </p>
      ) : (
        <ul>
          {doors.map((d, i) => {
            const match =
              d.keyId &&
              keys.some((k) => k.keyId === d.keyId);

            const isCurrent =
              currentRoomId &&
              d.roomId === currentRoomId;

            return (
              <li key={i}>
                <strong>
                  {d.roomId ?? "Unknown location"}
                </strong>
                {" — "}
                {d.state === "locked"
                  ? "Locked"
                  : "Unlocked"}

                {d.keyId && (
                  <>
                    {" "}
                    · Key:{" "}
                    <strong>{d.keyId}</strong>
                  </>
                )}

                {match && d.state === "locked" && (
                  <span style={{ color: "#ffd166" }}>
                    {" "}
                    ✔ Key Available
                  </span>
                )}

                {isCurrent && (
                  <span className="muted">
                    {" "}
                    (current room)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Advisory only — Arbiter determines if keys apply.
      </p>
    </section>
  );
}
