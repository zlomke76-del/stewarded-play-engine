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
// Chronicle Builder (RECIPROCAL FICTION, CANON-SAFE)
// ------------------------------------------------------------

function buildChronicle(
  resolution: SolaceResolution
): string {
  const mechanical = resolution.mechanical_resolution;

  // --------------------------------------------
  // Dice extraction (LEGACY-SAFE, SCHEMA-CORRECT)
  // --------------------------------------------

  const dice =
    mechanical &&
    typeof (mechanical as any).roll === "number" &&
    typeof (mechanical as any).dc === "number"
      ? {
          roll: (mechanical as any).roll,
          dc: (mechanical as any).dc,
        }
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
   * - situation_frame describes established fiction
   * - process elaborates attempted action
   * - aftermath records consequence and pressure
   *
   * All may be imaginative, never contradictory.
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
   * Outcome language:
   * - Never erases intent
   * - Prices risk proportionally
   * - Preserves forward pressure
   */
  let outcomeLine = "";
  switch (outcome) {
    case "success":
      outcomeLine =
        "The intent lands cleanly. The world yields, and advantage is secured.";
      break;

    case "setback":
      outcomeLine =
        "The intent takes hold, but not without cost. The world answers with resistance, adding pressure or fragility.";
      break;

    case "no_roll":
      outcomeLine =
        "The moment passes without contest. Conditions hold, unresolved.";
      break;
  }

  const diceLine = dice
    ? `🎲 d20 = ${dice.roll} vs DC ${dice.dc} — ${
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

  const mechanical = resolution.mechanical_resolution;

  // Canonical dice facts (for transparency only)
  const dice =
    mechanical &&
    typeof (mechanical as any).roll === "number" &&
    typeof (mechanical as any).dc === "number"
      ? {
          roll: (mechanical as any).roll,
          dc: (mechanical as any).dc,
        }
      : null;

  return recordEvent(state, {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actor: "solace",
    type: "OUTCOME",
    payload: {
      // Human-readable, immutable RPG canon
      description: chronicle,

      // Structural resolution for audit / replay
      resolution,

      // Mechanical facts only (no narration)
      dice,
    },
  });
}
