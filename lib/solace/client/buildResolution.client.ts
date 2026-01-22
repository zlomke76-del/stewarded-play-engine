// ------------------------------------------------------------
// CLIENT-SAFE RESOLUTION BUILDER
// ------------------------------------------------------------
// Purpose:
// - Convert legacy resolution payloads into a SolaceResolution
// - Browser-safe (no process.env, no Node crypto, no assertions)
// - Structural completeness ONLY (no validation, no judgment)
// ------------------------------------------------------------

import type { SolaceResolution } from "../solaceResolution.schema";

// NOTE:
// The turn index is tracked by the run / ledger,
// NOT embedded in SolaceResolution itself.

export function buildClientResolution(input: {
  legacyPayload: any;
  turn: number; // accepted for context, not embedded
}): SolaceResolution {
  const legacy = input.legacyPayload ?? {};

  return {
    // --------------------------------------------------------
    // Narrative signals (minimal but complete)
    // --------------------------------------------------------

    opening_signal:
      legacy.description ??
      "The moment resolves without ceremony.",

    situation_frame: [
      legacy.description ??
        "Conditions shift as the action concludes.",
    ],

    pressures: Array.isArray(legacy.audit) &&
      legacy.audit.length > 0
      ? [...legacy.audit].slice(0, 4)
      : ["Ambient pressure persists."],

    process: [
      legacy.dice?.justification ??
        "Events unfold according to circumstance.",
    ],

    aftermath: [
      "The consequences settle into the world.",
    ],

    closing_signal:
      "The turn ends. The weave holds.",

    // --------------------------------------------------------
    // Mechanical transparency (passthrough)
    // --------------------------------------------------------

    dice: legacy.dice ?? {
      mode: "none",
      roll: null,
      dc: 0,
      justification: "No mechanical resolution required.",
      source: "default",
    },

    audit: Array.isArray(legacy.audit)
      ? legacy.audit
      : [],

    // --------------------------------------------------------
    // World snapshot (optional)
    // --------------------------------------------------------

    world: legacy.world ?? null,
  };
}
