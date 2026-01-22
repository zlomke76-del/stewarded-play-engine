// ------------------------------------------------------------
// CLIENT-SAFE RESOLUTION BUILDER
// ------------------------------------------------------------
// Purpose:
// - Adapt legacy resolution payloads to SolaceResolution
// - Browser-safe (no process.env, no Node APIs)
// - STRICT schema conformance (no extra fields)
// ------------------------------------------------------------

import type { SolaceResolution } from "../solaceResolution.schema";

export function buildClientResolution(input: {
  legacyPayload: any;
  turn: number; // accepted but NOT embedded (ledger concern)
}): SolaceResolution {
  const legacy = input.legacyPayload ?? {};

  // ----------------------------------------------------------
  // Mechanical resolution mapping
  // ----------------------------------------------------------

  const roll =
    typeof legacy.dice?.roll === "number"
      ? legacy.dice.roll
      : 0;

  const dc =
    typeof legacy.dice?.dc === "number"
      ? legacy.dice.dc
      : 0;

  const outcome: SolaceResolution["mechanical_resolution"]["outcome"] =
    legacy.dice?.mode === "none" || dc === 0
      ? "no_roll"
      : roll >= dc
      ? "success"
      : roll >= dc - 2
      ? "partial"
      : "failure";

  // ----------------------------------------------------------
  // Resolution assembly (STRICT)
  // ----------------------------------------------------------

  return {
    opening_signal:
      typeof legacy.description === "string"
        ? legacy.description
        : "The moment resolves.",

    situation_frame: [
      typeof legacy.description === "string"
        ? legacy.description
        : "Conditions are evaluated."
    ].slice(0, 2),

    pressures: Array.isArray(legacy.audit) &&
      legacy.audit.length > 0
      ? legacy.audit.slice(0, 4)
      : ["Ambient conditions"],

    process: [
      legacy.dice?.justification ??
        "Forces interact without interruption."
    ].slice(0, 3),

    mechanical_resolution: {
      roll,
      dc,
      outcome
    },

    aftermath: [
      "The state of the world persists."
    ].slice(0, 3),

    closure: null
  };
}
