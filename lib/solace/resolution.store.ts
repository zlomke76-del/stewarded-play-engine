// ------------------------------------------------------------
// Solace Resolution Store Adapter
// ------------------------------------------------------------
// Ledger Persistence Layer (RPG MODE)
//
// Purpose:
// - Persist SolaceResolution objects to canon
// - Produce a living historical record at write-time
// - Remain append-only and irreversible
//
// RPG Invariant:
// - User intent is a fictional offer
// - Solace reciprocates within the declared frame
// - Dice price intent; they do not negate imagination
// - No contradictions of established canon
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import { recordEvent, SessionState } from "@/lib/session/SessionState";

// ------------------------------------------------------------
// Legacy Outcome Detection (schema-safe)
// ------------------------------------------------------------

function extractLegacyOutcome(
  mechanical: SolaceResolution["mechanical_resolution"]
): {
  roll?: number;
  dc?: number;
  outcome: "success" | "setback" | "no_roll";
} {
  if (
    mechanical &&
    typeof (mechanical as any).roll === "number" &&
    typeof (mechanical as any).dc === "number"
  ) {
    const roll = (mechanical as any).roll;
    const dc = (mechanical as any).dc;

    return {
      roll,
      dc,
      outcome: roll >= dc ? "success" : "setback",
    };
  }

  return { outcome: "no_roll" };
}

// ------------------------------------------------------------
// Chronicle Builder (RECIPROCAL FICTION, CANON-SAFE)
// ------------------------------------------------------------

function buildChronicle(resolution: SolaceResolution): string {
  const { roll, dc, outcome } = extractLegacyOutcome(
    resolution.mechanical_resolution
  );

  const situation = resolution.situation_frame.join(" ");
  const process = resolution.process.join(" ");
  const aftermath = resolution.aftermath.join(" ");

  let outcomeLine: string;

  switch (outcome) {
    case "success":
      outcomeLine =
        "The intent holds. The world yields enough for advantage to be secured.";
      break;

    case "setback":
      outcomeLine =
        "The intent takes shape, but not without cost. The world answers with resistance, adding pressure and consequence.";
      break;

    case "no_roll":
    default:
      outcomeLine =
        "The moment passes without contest. Conditions remain unresolved.";
  }

  const diceLine =
    roll !== undefined && dc !== undefined
      ? `🎲 d20 = ${roll} vs DC ${dc} — ${
          outcome === "success"
            ? "Success"
            : outcome === "setback"
            ? "Setback"
            : "No Roll"
        }`
      : "";

  return [
    situation,
    process,
    outcomeLine,
    aftermath,
    diceLine,
  ]
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ------------------------------------------------------------
// Canon Store
// ------------------------------------------------------------

export function storeSolaceResolution(
  state: SessionState,
  resolution: SolaceResolution
): SessionState {
  const chronicle = buildChronicle(resolution);

  const { roll, dc } = extractLegacyOutcome(
    resolution.mechanical_resolution
  );

  return recordEvent(state, {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: "solace",
    type: "OUTCOME",
    payload: {
      // Immutable narrative history (RPG canon)
      description: chronicle,

      // Structural resolution preserved for replay / audit
      resolution,

      // Optional factual dice (legacy-compatible)
      dice:
        roll !== undefined && dc !== undefined
          ? { roll, dc }
          : null,
    },
  });
}
