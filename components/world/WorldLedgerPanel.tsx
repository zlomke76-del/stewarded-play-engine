"use client";

// ------------------------------------------------------------
// WorldLedgerPanel — Living Chronicle
// ------------------------------------------------------------
// Purpose:
// - Render the run as a historical record
// - Summarize intent + outcome into narrative memory
// - Preserve transparency without killing the story
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
      ? "no contest"
      : roll >= dc
      ? "success"
      : "setback";

  return (
    <span className="muted" style={{ marginLeft: 8 }}>
      🎲 {mode} {roll} vs DC {dc} — {outcome}
    </span>
  );
}

function buildChronicleLine(payload: any): string {
  const intent = payload?.intent;
  const outcome = payload?.outcome;
  const world = payload?.world;

  let line = "";

  // 1. Anchor on actor if present
  if (typeof intent === "string" && intent.length > 0) {
    // compress intent into past-tense memory
    line += intent
      .replace(/^Chieftain\s+/i, "Chieftain ")
      .replace(/\.$/, "");
  } else {
    line += "The tribe acts";
  }

  // 2. Outcome integration (no mechanics language)
  switch (outcome) {
    case "success":
      line +=
        ", and the land yields to their effort";
      break;
    case "setback":
      line +=
        ", but the land resists and demands a cost";
      break;
    case "failure":
      line +=
        ", and the attempt collapses under pressure";
      break;
    case "no_roll":
      line +=
        ". Time passes without challenge";
      break;
    default:
      line +=
        ", and the balance of the world shifts";
  }

  // 3. Spatial memory
  if (world?.roomId) {
    line += ` in ${world.roomId}`;
  }

  return line + ".";
}

export default function WorldLedgerPanel({ events }: Props) {
  const outcomes = events.filter(
    (e) => e.type === "OUTCOME"
  );

  const byRoom = new Map<string, SessionEvent[]>();

  for (const e of outcomes) {
    const room = (e.payload as any)?.world?.roomId ?? "The Wilds";
    if (!byRoom.has(room)) byRoom.set(room, []);
    byRoom.get(room)!.push(e);
  }

  return (
    <CardSection title="World Ledger">
      {outcomes.length === 0 && (
        <p className="muted">No history yet.</p>
      )}

      {[...byRoom.entries()].map(([room, events]) => (
        <div key={room} style={{ marginBottom: 18 }}>
          <strong>{room}</strong>
          <ul>
            {events.map((e) => {
              const payload = e.payload as any;
              return (
                <li key={e.id} style={{ marginBottom: 6 }}>
                  {buildChronicleLine(payload)}
                  {renderDice(payload)}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </CardSection>
  );
}
