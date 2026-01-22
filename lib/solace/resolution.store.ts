// ------------------------------------------------------------
// Resolution Store Utilities
// ------------------------------------------------------------
// Purpose:
// - Extract legacy mechanical signals safely
// - Never assume dice exist
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

// ------------------------------------------------------------
// Local Guards
// ------------------------------------------------------------

function hasDiceMechanics(
  m: SolaceResolution["mechanical_resolution"]
): m is {
  roll: number;
  dc: number;
  outcome: string;
} {
  return (
    typeof m === "object" &&
    m !== null &&
    "roll" in m &&
    typeof (m as any).roll === "number"
  );
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

export function extractLegacyOutcome(
  resolution: SolaceResolution
): {
  roll: number;
  dc: number;
  outcome: string;
} | null {
  const mech = resolution.mechanical_resolution;

  if (!hasDiceMechanics(mech)) {
    return null;
  }

  const { roll, dc, outcome } = mech;
  return { roll, dc, outcome };
}
