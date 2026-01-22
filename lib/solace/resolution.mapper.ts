// ------------------------------------------------------------
// Solace Resolution Mapper
// ------------------------------------------------------------
// Legacy Payload → SolaceResolution Bridge
//
// Purpose:
// - Convert existing resolution payloads
//   into the new structured SolaceResolution
// - Preserve backward compatibility
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

interface LegacyResolutionPayload {
  description: string;
  dice: {
    roll: number | null;
    dc: number;
    mode: string;
    justification?: string;
  };
  audit?: string[];
}

export function mapLegacyResolutionToSolace(
  legacy: LegacyResolutionPayload
): SolaceResolution {
  return {
    opening_signal: "Solace resolves the exchange.",
    situation_frame: [
      "Conditions hold as the action unfolds."
    ],
    pressures: legacy.audit ?? [],
    process: [
      legacy.description
    ],
    mechanical_resolution: {
      roll: legacy.dice.roll ?? 0,
      dc: legacy.dice.dc,
      outcome:
        legacy.dice.roll === null
          ? "no_roll"
          : legacy.dice.roll >= legacy.dice.dc
          ? "success"
          : "setback"
    },
    aftermath: [
      "The world absorbs the result."
    ],
    closure: "The Weave holds."
  };
}
