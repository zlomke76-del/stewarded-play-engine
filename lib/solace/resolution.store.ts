// ------------------------------------------------------------
// Solace Resolution Store Adapter
// ------------------------------------------------------------
// Ledger Persistence Layer
//
// Purpose:
// - Persist SolaceResolution objects to canon
// - Produce a living historical record at write-time
// - Remain append-only and irreversible
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import {
  recordEvent,
  SessionState,
} from "@/lib/session/SessionState";

// ------------------------------------------------------------
// Chronicle Builder (NO NEW FACTS)
// ------------------------------------------------------------

function buildChronicle(
  resolution: SolaceResolution
): string {
  const dice = resolution.mechanical_resolution?.dice;

  // Outcome is DERIVED, never stored
  const outcome: "success" | "setback" | "no_roll" =
    dice &&
    typeof dice.roll === "number" &&
    typeof dice.dc === "number"
      ? dice.roll >= dice.dc
        ? "success"
        : "setback"
      : "no_roll";

  const intent =
    typeof resolution.intent === "string"
      ? resolution.intent.trim()
      : "";

  const situation = Array.isArray(
    resolution.situation_frame
  )
    ? resolution.situation_frame.join(" ")
    : "";

  const process = Array.isArray(resolution.process)
    ? resolution.process.join(" ")
    : "";

  const aftermath = Array.isArray(
    resolution.aftermath
  )
    ? resolution.aftermath.join(" ")
    : "";

  // Outcome framing — structural, not dramatic
  let outcomeLine = "";
  switch (outcome) {
    case "success":
      outcomeLine =
        "The attempt holds, and the balance of the world shifts.";
      break;
    case "setback":
      outcomeLine =
        "The effort meets resistance, and the land pushes back.";
      break;
    case "no_roll":
      outcomeLine =
        "Time advances without contest, and conditions persist.";
      break;
  }

  const diceLine =
    dice && typeof dice.roll === "number"
      ? ` (🎲 ${dice.roll} vs DC ${dice.dc})`
      : "";

  return [
    intent,
    situation,
    process,
    outcomeLine + diceLine,
    aftermath,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
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

  return recordEvent(state, {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: "solace",
    type: "OUTCOME",
    payload: {
      // Human-readable, immutable history
      description: chronicle,

      // Structural data preserved for audit / replay
      resolution,

      // Canon facts only (no interpretation)
      dice: resolution.mechanical_resolution?.dice,
      world: resolution.world ?? null,
    },
  });
}
