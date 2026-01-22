"use client";

// ------------------------------------------------------------
// WorldLedgerPanel (LEGACY — CLASSIC FANTASY ONLY)
// ------------------------------------------------------------
// This component exists ONLY to support SessionState-based games.
// It MUST NOT be used by Caveman / Solace-authoritative modes.
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

// ------------------------------------------------------------
// Dice rendering (legacy annotation)
// ------------------------------------------------------------

function renderDice(payload: any) {
  const dice = payload?.dice;
  if (!dice) return null;

  const { roll, dc } = dice;
  if (typeof roll !== "number" || typeof dc !== "number") return null;

  const outcome =
    roll >= dc ? "Success" : "Setback";

  return (
    <div className="muted" style={{ marginTop: 6 }}>
      🎲 d20 = {roll} vs DC {dc} — {outcome}
    </div>
  );
}

// ------------------------------------------------------------

export default function WorldLedgerPanelLegacy({
  events,
}: Props) {
  const outcomes = events.filter(
    (e) => e.type === "OUTCOME"
  );

  return (
    <CardSection title="World Ledger">
      {outcomes.length === 0 && (
        <p className="muted">
          No events have yet shaped the world.
        </p>
      )}

      <ul>
        {outcomes.map((e) => {
          const payload = e.payload as any;
          return (
            <li
              key={e.id}
              style={{ marginBottom: 16 }}
            >
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
              >
                {payload.description}
              </pre>

              {renderDice(payload)}
            </li>
          );
        })}
      </ul>
    </CardSection>
  );
}
