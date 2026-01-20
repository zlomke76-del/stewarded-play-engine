"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Read-only world state viewer
// Groups outcomes by room / map ID
// Displays resolved dice transparently
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

function renderDice(payload: any) {
  const dice = payload?.dice;
  if (!dice) return null;

  const { mode, roll, dc } = dice;

  if (roll === null || typeof dc !== "number") return null;

  const outcome =
    dc === 0
      ? "No roll required"
      : roll >= dc
      ? "Success"
      : "Setback";

  return (
    <span className="muted" style={{ marginLeft: 6 }}>
      🎲 {mode} {roll} vs DC {dc} — {outcome}
    </span>
  );
}

export default function WorldLedgerPanel({ events }: Props) {
  const outcomes = events.filter((e) => e.type === "OUTCOME");

  const byRoom = new Map<string, SessionEvent[]>();
  const global: SessionEvent[] = [];

  for (const e of outcomes) {
    const payload = e.payload as any;
    const room = payload?.world?.roomId;

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
        <div key={room} style={{ marginBottom: 14 }}>
          <strong>Room {room}</strong>
          <ul>
            {events.map((e) => {
              const payload = e.payload as any;
              return (
                <li key={e.id}>
                  {String(payload.description)}
                  {renderDice(payload)}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {global.length > 0 && (
        <>
          <strong>Global</strong>
          <ul>
            {global.map((e) => {
              const payload = e.payload as any;
              return (
                <li key={e.id}>
                  {String(payload.description)}
                  {renderDice(payload)}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </CardSection>
  );
}
