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

  const situation = Array.isArray(resolution.situation_frame)
    ? resolution.situation_frame.join(" ")
    : "";

  const process = Array.isArray(resolution.process)
    ? resolution.process.join(" ")
    : "";

  const aftermath = Array.isArray(resolution.aftermath)
    ? resolution.aftermath.join(" ")
    : "";

  /**
   * Outcome lines must:
   * - Never negate intent
   * - Signal consequence, not incompetence
   * - Preserve authority and agency
   * - Leave room for future pressure math
   */
  let outcomeLine = "";
  switch (outcome) {
    case "success":
      outcomeLine =
        "The attempt holds, and the world yields without immediate cost.";
      break;

    case "setback":
      outcomeLine =
        "The attempt takes hold, but not without cost. The world answers with resistance, introducing pressure and consequence.";
      break;

    case "no_roll":
      outcomeLine =
        "Time advances without contest, and conditions persist unchanged.";
      break;
  }

  const diceLine = dice
    ? ` (🎲 ${dice.roll} vs DC ${dice.dc})`
    : "";

  return [
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
      // Human-readable, immutable history
      description: chronicle,

      // Structural data preserved for audit / replay
      resolution,

      // Canon facts only (legacy-safe)
      dice,
    },
  });
}
