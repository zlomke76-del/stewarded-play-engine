"use client";

// ------------------------------------------------------------
// RoomLedgerPanel.tsx
// ------------------------------------------------------------
// Inspect-only room ledger.
// Clicking a room NEVER moves the party.
// Derived strictly from recorded canon.
// ------------------------------------------------------------

import React, { useMemo, useState } from "react";

// ------------------------------------------------------------
// Types (minimal, safe)
// ------------------------------------------------------------

type SessionEvent = {
  id: string;
  type: string;
  payload?: {
    description?: string;
    world?: {
      roomId?: string;
      primary?: string;
      trap?: {
        id: string;
        state: string;
      };
      lock?: {
        state: string;
        keyId?: string;
      };
    };
  };
};

type Props = {
  events: readonly SessionEvent[];
  currentRoomId?: string;
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function deriveRooms(events: readonly SessionEvent[]) {
  const map = new Map<string, SessionEvent[]>();

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;
    const roomId = e.payload?.world?.roomId;
    if (!roomId) return;

    if (!map.has(roomId)) {
      map.set(roomId, []);
    }
    map.get(roomId)!.push(e);
  });

  return map;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function RoomLedgerPanel({
  events,
  currentRoomId,
}: Props) {
  const rooms = useMemo(() => deriveRooms(events), [events]);

  const roomIds = Array.from(rooms.keys());

  const [selectedRoom, setSelectedRoom] =
    useState<string | null>(null);

  return (
    <section className="card">
      <h3>🗺️ Known Rooms</h3>

      {roomIds.length === 0 ? (
        <p className="muted">
          No rooms have been committed to canon yet.
        </p>
      ) : (
        <ul>
          {roomIds.map((id) => (
            <li key={id}>
              <button
                onClick={() => setSelectedRoom(id)}
                style={{
                  fontWeight:
                    id === currentRoomId
                      ? "bold"
                      : "normal",
                }}
              >
                {id}
                {id === currentRoomId
                  ? " (current)"
                  : ""}
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h4>Room Ledger</h4>

      {selectedRoom ? (
        <>
          <p className="muted">
            Inspecting <strong>{selectedRoom}</strong>
            <br />
            Inspection only — selecting a room does
            not move the party.
          </p>

          <ul>
            {rooms.get(selectedRoom)!.map((e) => (
              <li key={e.id}>
                {e.payload?.description}

                {e.payload?.world?.trap && (
                  <div className="muted">
                    Trap:{" "}
                    {e.payload.world.trap.state}
                  </div>
                )}

                {e.payload?.world?.lock && (
                  <div className="muted">
                    Door:{" "}
                    {e.payload.world.lock.state}
                    {e.payload.world.lock.keyId
                      ? ` (Key: ${e.payload.world.lock.keyId})`
                      : ""}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted">
          Select a room to inspect its history.
        </p>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Advisory view only — Arbiter retains full
        authority.
      </p>
    </section>
  );
}
