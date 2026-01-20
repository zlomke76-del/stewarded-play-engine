"use client";

// ------------------------------------------------------------
// FogOfWarPanel
// ------------------------------------------------------------
// Purpose:
// - Displays ONLY canon-confirmed spatial knowledge
// - No auto-reveal, no guessing, no map generation
// - Reflects Arbiter-recorded world state only
//
// Fog of War rule:
// If it has not been recorded as canon, it does not exist yet.
// ------------------------------------------------------------

import CardSection from "@/components/layout/CardSection";

type SessionEvent = {
  id: string;
  type: string;
  payload: any;
};

type Props = {
  events: readonly SessionEvent[];
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function extractWorldState(events: readonly SessionEvent[]) {
  let currentRoom: string | null = null;
  const exploredRooms = new Set<string>();

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;

    const world = e.payload?.world;
    if (!world) continue;

    if (world.roomId) {
      currentRoom = world.roomId;
      exploredRooms.add(world.roomId);
    }
  }

  return {
    currentRoom,
    exploredRooms: Array.from(exploredRooms),
  };
}

// ------------------------------------------------------------

export default function FogOfWarPanel({ events }: Props) {
  const { currentRoom, exploredRooms } = extractWorldState(events);

  return (
    <CardSection title="Fog of War">
      <p className="muted" style={{ marginBottom: 8 }}>
        Only locations confirmed by the Arbiter exist in canon.
        Unrecorded rooms remain unknown.
      </p>

      {currentRoom ? (
        <>
          <p>
            <strong>Current Location:</strong>{" "}
            {currentRoom}
          </p>

          <p style={{ marginTop: 8 }}>
            <strong>Explored Areas:</strong>
          </p>

          <ul>
            {exploredRooms.map((room) => (
              <li key={room}>{room}</li>
            ))}
          </ul>

          <p className="muted" style={{ marginTop: 8 }}>
            Adjacent rooms, hidden passages, and threats remain
            unrevealed until explicitly discovered and recorded.
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>No confirmed locations yet.</strong>
          </p>
          <p className="muted">
            The party exists in an implied space, but no room has
            been committed to canon. Exploration begins when the
            Arbiter records the first location.
          </p>
        </>
      )}
    </CardSection>
  );
}
