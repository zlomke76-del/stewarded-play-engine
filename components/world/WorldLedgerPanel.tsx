"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Living Chronicle of Canonical Events
//
// Purpose:
// - Render confirmed OUTCOME events as evolving history
// - Display Solace-authored canon verbatim
// - Show dice as factual annotation only
//
// HARD RULE:
// - This component NEVER rewrites narrative
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

// ------------------------------------------------------------
// Dice rendering (factual annotation only)
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
// Prologue (derived, not invented)
// ------------------------------------------------------------

function buildPrologue(outcomes: SessionEvent[]): string | null {
  if (outcomes.length === 0) return null;

  return `The journey begins in the wilds. The world waits to answer the choices made.`;
}

// ------------------------------------------------------------
// Epilogue (derived, not rewritten)
// ------------------------------------------------------------

function buildEpilogue(outcomes: SessionEvent[]): string | null {
  if (outcomes.length === 0) return null;

  return `What has been done now settles into memory. The world carries it forward.`;
}

// ------------------------------------------------------------

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

  const prologue = buildPrologue(outcomes);
  const epilogue = buildEpilogue(outcomes);

  return (
    <CardSection title="World Ledger">
      {outcomes.length === 0 && (
        <p className="muted">No events have yet shaped the world.</p>
      )}

      {prologue && (
        <p style={{ marginBottom: 16 }}>
          <em>{prologue}</em>
        </p>
      )}

      {[...byRoom.entries()].map(([room, events]) => (
        <div key={room} style={{ marginBottom: 24 }}>
          <strong>📍 {room}</strong>
          <ul>
            {events.map((e) => {
              const payload = e.payload as any;
              return (
                <li key={e.id} style={{ marginBottom: 14 }}>
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                    {payload.description}
                  </pre>
                  {renderDice(payload)}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {global.length > 0 && (
        <>
          <strong>🌍 Beyond Any Single Place</strong>
          <ul>
            {global.map((e) => {
              const payload = e.payload as any;
              return (
                <li key={e.id} style={{ marginBottom: 14 }}>
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                    {payload.description}
                  </pre>
                  {renderDice(payload)}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {epilogue && (
        <p style={{ marginTop: 18 }}>
          <em>{epilogue}</em>
        </p>
      )}
    </CardSection>
  );
}
