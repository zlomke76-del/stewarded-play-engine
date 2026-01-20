"use client";

// ------------------------------------------------------------
// LockedDoorPanel
// ------------------------------------------------------------
// Persistent door state viewer
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

export default function LockedDoorPanel({ events }: Props) {
  const doors = new Map<string, string>();

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;
    const p = e.payload as any;
    const doorId = p.world?.doorId;
    const state = p.world?.doorState;

    if (doorId && state) {
      doors.set(doorId, state);
    }
  }

  return (
    <CardSection title="Doors">
      {doors.size === 0 ? (
        <p className="muted">No known doors.</p>
      ) : (
        <ul>
          {[...doors.entries()].map(([id, state]) => (
            <li key={id}>
              Door {id}: <strong>{state}</strong>
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}
