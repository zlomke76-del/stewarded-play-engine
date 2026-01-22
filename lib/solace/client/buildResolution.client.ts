// ------------------------------------------------------------
// CLIENT-SAFE RESOLUTION BUILDER
// ------------------------------------------------------------
// Purpose:
// - Convert legacy resolution payloads into a SolaceResolution
// - Browser-safe (no process.env, no Node crypto)
// - Structural completeness ONLY
// ------------------------------------------------------------

import type { SolaceResolution } from "../solaceResolution.schema";

// NOTE:
// Turn is tracked by the ResolutionRun / ledger,
// not embedded in SolaceResolution.

export function buildClientResolution(input: {
  legacyPayload: any;
  turn: number; // accepted for context only
}): SolaceResolution {
  const legacy = input.legacyPayload ?? {};

  return {
    // --------------------------------------------------------
    // Narrative signals
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

    // --------------------------------------------------------
    // Mechanical transparency
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
    // World snapshot
    // --------------------------------------------------------

    world: legacy.world ?? null,
  };
}
