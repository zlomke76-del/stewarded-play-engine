"use client";

// ------------------------------------------------------------
// KeyDoorPanel
// ------------------------------------------------------------
// Advisory-only key inventory & door matching visualization
//
// Purpose:
// - Make progression constraints visible
// - Show which doors can be opened with which keys
// - Highlight locked vs unlocked paths
//
// NO authority
// NO mutation
// NO automation
// ------------------------------------------------------------

import React, { useMemo } from "react";

// ------------------------------------------------------------
// Types (minimal, compatible with canon)
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: any;
};

type Key = {
  id: string;
  label: string;
};

type Door = {
  roomId?: string;
  state: "locked" | "unlocked";
  keyId?: string;
};

// ------------------------------------------------------------
// Helpers — pure derivation
// ------------------------------------------------------------

function deriveKeys(events: readonly SessionEvent[]): Key[] {
  const keys = new Map<string, Key>();

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;

    const w = e.payload?.world;
    if (!w?.lock?.keyId) return;

    // Key becomes known once referenced
    if (!keys.has(w.lock.keyId)) {
      keys.set(w.lock.keyId, {
        id: w.lock.keyId,
        label: w.lock.keyId,
      });
    }
  });

  return Array.from(keys.values());
}

function deriveDoors(events: readonly SessionEvent[]): Door[] {
  const doors: Door[] = [];

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

type Props = {
  events: readonly SessionEvent[];
};

export default function KeyDoorPanel({ events }: Props) {
  const keys = useMemo(() => deriveKeys(events), [events]);
  const doors = useMemo(() => deriveDoors(events), [events]);

  return (
    <section className="card">
      <h3>🗝️ Keys & Locked Doors (Advisory)</h3>

      {/* ---------------- KEYS ---------------- */}
      <p>
        <strong>Key Inventory</strong>
      </p>

      {keys.length === 0 ? (
        <p className="muted">
          No keys discovered yet.
        </p>
      ) : (
        <ul>
          {keys.map((k) => (
            <li key={k.id}>🔑 {k.label}</li>
          ))}
        </ul>
      )}

      <hr />

      {/* ---------------- DOORS ---------------- */}
      <p>
        <strong>Doors Encountered</strong>
      </p>

      {doors.length === 0 ? (
        <p className="muted">
          No locked doors recorded.
        </p>
      ) : (
        <ul>
          {doors.map((d, i) => {
            const hasKey =
              d.keyId &&
              keys.some((k) => k.id === d.keyId);

            return (
              <li key={i}>
                🚪{" "}
                {d.roomId
                  ? `Room ${d.roomId}`
                  : "Unknown location"}{" "}
                —{" "}
                <strong>
                  {d.state.toUpperCase()}
                </strong>
                {d.keyId && (
                  <>
                    {" "}
                    · Key:{" "}
                    <span
                      style={{
                        color: hasKey
                          ? "#2a9d8f"
                          : "#e63946",
                      }}
                    >
                      {d.keyId}
                    </span>
                  </>
                )}
                {d.state === "locked" &&
                  d.keyId &&
                  !hasKey && (
                    <span className="muted">
                      {" "}
                      (No matching key)
                    </span>
                  )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Advisory only — Arbiter determines access,
        key usage, and consequences.
      </p>
    </section>
  );
}
