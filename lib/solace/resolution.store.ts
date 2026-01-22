// ------------------------------------------------------------
// Resolution Store Utilities
// ------------------------------------------------------------
// Purpose:
// - Safely extract legacy mechanical outcomes
// - Never assume dice exist
// - Never widen authority beyond schema
// ------------------------------------------------------------

import type {
  SolaceResolution,
  LegacyMechanicalResolution,
} from "./solaceResolution.schema";

// ------------------------------------------------------------
// Local Guards
// ------------------------------------------------------------

function hasDiceMechanics(
  m: SolaceResolution["mechanical_resolution"]
): m is LegacyMechanicalResolution & {
  roll: number;
  dc: number;
} {
  if (typeof m !== "object" || m === null) {
    return false;
  }

  if (!("outcome" in m)) {
    return false;
  }

  if (typeof (m as any).roll !== "number") {
    return false;
  }

  if (typeof (m as any).dc !== "number") {
    return false;
  }

  return true;
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

export function extractLegacyOutcome(
  resolution: SolaceResolution
): {
  roll: number;
  dc: number;
  outcome: LegacyMechanicalResolution["outcome"];
} | null {
  const mech = resolution.mechanical_resolution;

  if (!hasDiceMechanics(mech)) {
    return null;
  }

  const { roll, dc, outcome } = mech;
  return { roll, dc, outcome };
}
