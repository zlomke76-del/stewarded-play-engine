"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Living Chronicle of Canonical Events
//
// Purpose:
// - Render confirmed OUTCOME events as evolving history
// - Compose narrative from facts already recorded
// - Never invent state, outcomes, or causality
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
// Chronicle composer (NO NEW FACTS)
// ------------------------------------------------------------

function chronicleLine(payload: any): string {
  const actor = payload.actorLabel ?? "The party";
  const intent = payload.intent ?? payload.description ?? "act";
  const dice = payload.dice;

  let outcome: "success" | "setback" | "failure" | "no_roll" = "no_roll";

  if (dice && typeof dice.roll === "number" && typeof dice.dc === "number") {
    outcome = dice.roll >= dice.dc ? "success" : "setback";
  }

  switch (outcome) {
    case "success":
      return `${actor} press forward and prevail. ${intent}`;
    case "setback":
      return `${actor} advance, but resistance slows their progress. ${intent}`;
    case "failure":
      return `${actor} are driven back by harsh consequence. ${intent}`;
    case "no_roll":
      return `${actor} move through a quiet moment. ${intent}`;
    default:
      return `${actor} act. ${intent}`;
  }
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

  return (
    <CardSection title="World Ledger">
      {outcomes.length === 0 && (
        <p className="muted">No events have yet shaped the world.</p>
      )}

      {[...byRoom.entries()].map(([room, events]) => (
        <div key={room} style={{ marginBottom: 16 }}>
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
    </CardSection>
  );
}
