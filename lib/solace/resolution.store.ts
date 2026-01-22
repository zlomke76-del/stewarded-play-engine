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
// Type Guards (legacy-safe)
// ------------------------------------------------------------

function hasDice(
  value: unknown
): value is { roll: number; dc: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).roll === "number" &&
    typeof (value as any).dc === "number"
  );
}

// ------------------------------------------------------------
// Chronicle Builder (NO NEW FACTS)
// ------------------------------------------------------------

function buildChronicle(
  resolution: SolaceResolution
): string {
  const mechanical = resolution.mechanical_resolution;

  const dice =
    mechanical &&
    "dice" in mechanical &&
    hasDice((mechanical as any).dice)
      ? (mechanical as any).dice
      : null;

  // Outcome is DERIVED, never stored
  const outcome: "success" | "setback" | "no_roll" =
    dice
      ? dice.roll >= dice.dc
        ? "success"
        : "setback"
      : "no_roll";

  const intent =
    typeof resolution.intent === "string"
      ? resolution.intent.trim()
      : "";

  const situation = Array.isArray(resolution.situation_frame)
    ? resolution.situation_frame.join(" ")
    : "";

  const process = Array.isArray(resolution.process)
    ? resolution.process.join(" ")
    : "";

  const aftermath = Array.isArray(resolution.aftermath)
    ? resolution.aftermath.join(" ")
    : "";

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

  const diceLine = dice
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

  const mechanical = resolution.mechanical_resolution;

  const dice =
    mechanical &&
    "dice" in mechanical &&
    hasDice((mechanical as any).dice)
      ? (mechanical as any).dice
      : null;

  return recordEvent(state, {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: "solace",
    type: "OUTCOME",
    payload: {
      description: chronicle,
      resolution,
      dice,
      world: resolution.world ?? null,
    },
  });
}
