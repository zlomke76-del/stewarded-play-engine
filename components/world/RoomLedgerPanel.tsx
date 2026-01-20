"use client";

// ------------------------------------------------------------
// RoomLedgerPanel.tsx
// ------------------------------------------------------------
// Read-only room navigation + scoped ledger
//
// Invariants:
// - Canon only
// - No state mutation
// - No movement authority
// - Selection is purely visual
// ------------------------------------------------------------

import { useMemo, useState } from "react";

// ------------------------------------------------------------
// Types
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
// Helpers
// ------------------------------------------------------------

function collectRooms(events: readonly SessionEvent[]): string[] {
  const rooms = new Set<string>();

  events.forEach((e) => {
    if (e.type !== "OUTCOME") return;
    const roomId = e.payload?.world?.roomId;
    if (roomId) rooms.add(roomId);
  });

  return Array.from(rooms);
}

function roomLabel(roomId: string) {
  return roomId;
}

function filterEventsForRoom(
  events: readonly SessionEvent[],
  roomId: string
) {
  return events.filter(
    (e) =>
      e.type === "OUTCOME" &&
      e.payload?.world?.roomId === roomId
  );
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function RoomLedgerPanel({
  events,
  currentRoomId,
}: Props) {
  const rooms = useMemo(
    () => collectRooms(events),
    [events]
  );

  const [selectedRoom, setSelectedRoom] =
    useState<string | null>(null);

  const activeRoom = selectedRoom ?? currentRoomId;

  const roomEvents = useMemo(() => {
    if (!activeRoom) return [];
    return filterEventsForRoom(events, activeRoom);
  }, [events, activeRoom]);

  return (
    <section className="card">
      <h3>🗺️ Known Rooms</h3>

      {rooms.length === 0 ? (
        <p className="muted">
          No rooms have been recorded yet.
        </p>
      ) : (
        <ul style={{ paddingLeft: 16 }}>
          {rooms.map((roomId) => {
            const isCurrent =
              roomId === currentRoomId;
            const isSelected =
              roomId === activeRoom;

            return (
              <li key={roomId}>
                <button
                  onClick={() =>
                    setSelectedRoom(roomId)
                  }
                  style={{
                    fontWeight: isCurrent
                      ? "bold"
                      : "normal",
                    textDecoration: isSelected
                      ? "underline"
                      : "none",
                  }}
                >
                  {roomLabel(roomId)}
                  {isCurrent && " 📍"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <hr />

      <h4>
        Room Ledger{" "}
        {activeRoom ? `— ${activeRoom}` : ""}
      </h4>

      {!activeRoom ? (
        <p className="muted">
          Select a room to inspect its history.
        </p>
      ) : roomEvents.length === 0 ? (
        <p className="muted">
          No recorded events for this room.
        </p>
      ) : (
        <ul>
          {roomEvents.map((e) => (
            <li key={e.id}>
              {String(e.payload?.description)}
            </li>
          ))}
        </ul>
      )}

      <p className="muted" style={{ marginTop: 8 }}>
        Inspection only — selecting a room does not
        move the party.
      </p>
    </section>
  );
}
