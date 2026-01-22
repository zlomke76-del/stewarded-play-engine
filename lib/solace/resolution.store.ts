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
// Chronicle Builder (RECIPROCAL FICTION, CANON-SAFE)
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

  /**
   * In RPG mode:
   * - situation_frame describes the established fiction
   * - process elaborates the attempted action
   * - aftermath records consequences, gains, and pressures
   *
   * All three may contain imaginative content
   * so long as they do not contradict prior canon.
   */
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
   * - Respect agency
   * - Never erase intent
   * - Signal consequence proportional to dice
   * - Preserve forward pressure
   */
  let outcomeLine = "";
  switch (outcome) {
    case "success":
      outcomeLine =
        "The intent lands cleanly. The world yields, and advantage is secured.";
      break;

    case "setback":
      outcomeLine =
        "The intent takes hold, but not without cost. The world answers with resistance, adding pressure, exposure, or fragility.";
      break;

    case "no_roll":
      outcomeLine =
        "The moment passes without contest. Conditions hold, unresolved.";
      break;
  }

  const diceLine = dice
    ? ` 🎲 d${20} = ${dice.roll} vs DC ${dice.dc} — ${outcome === "success" ? "Success" : outcome === "setback" ? "Setback" : "No Roll"}`
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
      // Human-readable, immutable history (RPG canon)
      description: chronicle,

      // Structural data preserved for audit / replay
      resolution,

      // Canon facts only
      dice,
    },
  });
}
