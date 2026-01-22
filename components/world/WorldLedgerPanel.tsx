"use client";

// ------------------------------------------------------------
// WorldLedgerPanel
// ------------------------------------------------------------
// Living chronicle of the world
//
// Rules:
// - Never invent new facts
// - Never alter canon
// - Compress intent + outcome into history
// - Degrade safely if payload is thin
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
  if (roll == null || typeof dc !== "number") return null;

  const outcome =
    dc === 0
      ? "no contest"
      : roll >= dc
      ? "success"
      : "setback";

  return (
    <span className="muted" style={{ marginLeft: 6 }}>
      🎲 {mode} {roll} vs DC {dc} — {outcome}
    </span>
  );
}

/**
 * Build a living chronicle sentence from available facts.
 * This NEVER introduces new state — it only compresses.
 */
function buildLedgerLine(payload: any): string {
  const actor =
    typeof payload.actor === "string"
      ? payload.actor
      : "The tribe";

  const intent =
    typeof payload.intent === "string"
      ? payload.intent.trim()
      : null;

  const outcome =
    typeof payload.outcome === "string"
      ? payload.outcome
      : null;

  const room =
    typeof payload?.world?.roomId === "string"
      ? payload.world.roomId
      : "the world";

  // --- Ideal path: intent + outcome ---
  if (intent && outcome) {
    switch (outcome) {
      case "success":
        return `${actor} acts with purpose. What was attempted holds, and the balance shifts in ${room}.`;
      case "setback":
        return `${actor} presses forward, but the land resists. The effort costs them in ${room}.`;
      case "failure":
        return `${actor}'s attempt collapses under pressure. The world pushes back in ${room}.`;
      default:
        return `${actor} acts, and events unfold in ${room}.`;
    }
  }

  // --- Partial path: intent only ---
  if (intent) {
    return `${actor} attempts a course of action. The outcome is now written into the world.`;
  }

  // --- Fallback: legacy description ---
  if (typeof payload.description === "string") {
    return payload.description;
  }

  // --- Absolute fallback ---
  return "The world changes, and the record holds.";
}

export default function WorldLedgerPanel({ events }: Props) {
  const outcomes = events.filter((e) => e.type === "OUTCOME");

  const byRoom = new Map<string, SessionEvent[]>();
  const global: SessionEvent[] = [];

  for (const e of outcomes) {
    const payload = e.payload as any;
    const room = payload?.world?.roomId;

    if (typeof room === "string") {
      if (!byRoom.has(room)) byRoom.set(room, []);
      byRoom.get(room)!.push(e);
    } else {
      global.push(e);
    }
  }

  return (
    <CardSection title="World Ledger">
      {outcomes.length === 0 && (
        <p className="muted">No history has yet been written.</p>
      )}

      {[...byRoom.entries()].map(([room, events]) => (
        <div key={room} style={{ marginBottom: 16 }}>
          <strong>{room}</strong>
          <ul>
            {events.map((e) => {
              const payload = e.payload as any;
              return (
                <li key={e.id}>
                  {buildLedgerLine(payload)}
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
                  {buildLedgerLine(payload)}
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
