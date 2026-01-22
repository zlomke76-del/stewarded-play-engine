"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Living Chronicle of Canonical Events
//
// Purpose:
// - Render confirmed OUTCOME events as evolving history
// - Add session prologue and epilogue derived from canon
// - Never invent facts, outcomes, or causality
// ------------------------------------------------------------

import type { SessionEvent } from "@/lib/session/SessionState";
import CardSection from "@/components/layout/CardSection";

type Props = {
  events: readonly SessionEvent[];
};

// ------------------------------------------------------------
// Dice rendering (transparent, factual)
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Chronicle line composer (NO NEW FACTS)
// ------------------------------------------------------------

function chronicleLine(payload: any): string {
  const actor = payload.actorLabel ?? "The party";
  const intent = payload.intent ?? payload.description ?? "take action";
  const dice = payload.dice;

  let outcome: "success" | "setback" | "no_roll" = "no_roll";

  if (dice && typeof dice.roll === "number" && typeof dice.dc === "number") {
    outcome = dice.roll >= dice.dc ? "success" : "setback";
  }

  switch (outcome) {
    case "success":
      return `${actor} press forward and prevail. ${intent}`;
    case "setback":
      return `${actor} advance, but resistance slows or redirects their progress. ${intent}`;
    case "no_roll":
      return `${actor} move through a quiet moment. ${intent}`;
    default:
      return `${actor} act. ${intent}`;
  }
}

// ------------------------------------------------------------
// Prologue (derived from earliest canon only)
// ------------------------------------------------------------

function buildPrologue(outcomes: SessionEvent[]): string | null {
  if (outcomes.length === 0) return null;

  const first = outcomes[0];
  const room = (first.payload as any)?.world?.roomId;

  if (room) {
    return `The journey begins in ${room}. The party steps forward, unaware of how the world will answer their choices.`;
  }

  return `The journey begins. The party steps forward into uncertainty.`;
}

// ------------------------------------------------------------
// Epilogue (derived from final canon only)
// ------------------------------------------------------------

function buildEpilogue(outcomes: SessionEvent[]): string | null {
  if (outcomes.length === 0) return null;

  const last = outcomes[outcomes.length - 1];
  const dice = (last.payload as any)?.dice;

  if (!dice || typeof dice.roll !== "number" || typeof dice.dc !== "number") {
    return `The tale settles into stillness. What was done now remains.`;
  }

  const success = dice.roll >= dice.dc;

  if (success) {
    return `Against resistance, the party endures. The world bears the mark of their passage.`;
  }

  return `The world does not yield easily. What was gained came at a cost, and the echoes linger.`;
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
        <div key={room} style={{ marginBottom: 18 }}>
          <strong>📍 {room}</strong>
          <ul>
            {events.map((e) => {
              const payload = e.payload as any;
              return (
                <li key={e.id}>
                  {chronicleLine(payload)}
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
                <li key={e.id}>
                  {chronicleLine(payload)}
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
