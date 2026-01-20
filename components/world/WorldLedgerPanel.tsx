"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Read-only projection of canonical world state changes.
// - Derived ONLY from recorded OUTCOME events
// - No editing, no mutation, no authority
// - Supports optional location tags if present
// ------------------------------------------------------------

import React from "react";

type WorldLedgerEntry = {
  id: string;
  turn: number;
  description: string;
  location?: string;
};

type Props = {
  events: Array<{
    id: string;
    type: string;
    payload: any;
  }>;
};

export default function WorldLedgerPanel({ events }: Props) {
  // Extract canon-only outcomes
  const outcomes = events.filter((e) => e.type === "OUTCOME");

  if (outcomes.length === 0) {
    return (
      <section className="card fade-in">
        <h2>World Ledger</h2>
        <p className="muted">No world changes recorded yet.</p>
      </section>
    );
  }

  const ledger: WorldLedgerEntry[] = outcomes.map((event, index) => ({
    id: event.id,
    turn: index + 1,
    description: String(event.payload?.description ?? "Unspecified outcome"),
    location: event.payload?.location,
  }));

  return (
    <section className="card fade-in">
      <h2>World Ledger (Read-Only)</h2>

      <ul style={{ marginTop: 8 }}>
        {ledger.map((entry) => (
          <li key={entry.id} style={{ marginBottom: 8 }}>
            <strong>Turn {entry.turn}:</strong>{" "}
            {entry.description}
            {entry.location && (
              <span className="muted">
                {" "}
                · Location: {entry.location}
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="muted" style={{ marginTop: 8 }}>
        Canon-only projection · Derived from recorded outcomes
      </p>
    </section>
  );
}
