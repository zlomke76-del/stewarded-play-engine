"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Read-only world state ledger
// - Displays confirmed OUTCOME events
// - Does NOT mutate canon
// - Accepts readonly SessionEvent[]
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

export default function WorldLedgerPanel({ events }: Props) {
  const outcomes = events.filter(
    (e) => e.type === "OUTCOME"
  );

  return (
    <CardSection title="World Ledger">
      {outcomes.length === 0 ? (
        <p className="muted">
          No world state changes recorded yet.
        </p>
      ) : (
        <ul>
          {outcomes.map((event) => {
            const payload = event.payload as any;

            return (
              <li key={event.id}>
                <strong>
                  {payload.world?.primary ??
                    "World Update"}
                </strong>
                <br />
                <span>
                  {String(payload.description)}
                </span>

                {payload.world?.scope && (
                  <div className="muted">
                    Scope: {payload.world.scope}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </CardSection>
  );
}
