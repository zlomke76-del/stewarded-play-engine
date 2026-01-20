"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Read-only world state viewer
// Groups outcomes by room / map ID
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

export default function WorldLedgerPanel({ events }: Props) {
  const outcomes = events.filter((e) => e.type === "OUTCOME");

  const byRoom = new Map<string, SessionEvent[]>();
  const global: SessionEvent[] = [];

  for (const e of outcomes) {
    const payload = e.payload as any;
    const room = payload.world?.roomId;

    if (room) {
      if (!byRoom.has(room)) byRoom.set(room, []);
      byRoom.get(room)!.push(e);
    } else {
      global.push(e);
    }
  }

  return (
    <CardSection title="World Ledger">
      {outcomes.length === 0 && (
        <p className="muted">No world changes recorded yet.</p>
      )}

      {[...byRoom.entries()].map(([room, events]) => (
        <div key={room} style={{ marginBottom: 12 }}>
          <strong>Room {room}</strong>
          <ul>
            {events.map((e) => (
              <li key={e.id}>
                {String((e.payload as any).description)}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {global.length > 0 && (
        <>
          <strong>Global</strong>
          <ul>
            {global.map((e) => (
              <li key={e.id}>
                {String((e.payload as any).description)}
              </li>
            ))}
          </ul>
        </>
      )}
    </CardSection>
  );
}
