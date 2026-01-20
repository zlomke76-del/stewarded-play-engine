"use client";

// ------------------------------------------------------------
// TrapLedgerPanel
// ------------------------------------------------------------
// Persistent trap tracking
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

export default function TrapLedgerPanel({ events }: Props) {
  const traps = new Map<string, string>();

  for (const e of events) {
    if (e.type !== "OUTCOME") continue;
    const p = e.payload as any;
    const trapId = p.world?.trapId;
    const state = p.world?.trapState;

    if (trapId && state) {
      traps.set(trapId, state);
    }
  }

  return (
    <CardSection title="Traps">
      {traps.size === 0 ? (
        <p className="muted">No traps discovered.</p>
      ) : (
        <ul>
          {[...traps.entries()].map(([id, state]) => (
            <li key={id}>
              Trap {id}: <strong>{state}</strong>
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}
