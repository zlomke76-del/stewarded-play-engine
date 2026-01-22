// ------------------------------------------------------------
// Solace Resolution Metrics
// ------------------------------------------------------------
// Entropy, Survival Length, Pressure Load
//
// Purpose:
// - Quantify run characteristics
// - Remain descriptive, not evaluative
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type Outcome =
  | "success"
  | "partial"
  | "setback"
  | "failure"
  | "no_roll";

export interface ResolutionMetrics {
  survivalLength: number;
  entropyScore: number;
  pressureLoad: number;
  outcomeDistribution: Record<Outcome, number>;
}

// ------------------------------------------------------------
// Type Guard
// ------------------------------------------------------------

function hasOutcome(
  m: SolaceResolution["mechanical_resolution"]
): m is {
  roll: number;
  dc: number;
  outcome: Outcome;
} {
  return (
    typeof (m as any).outcome === "string"
  );
}

// ------------------------------------------------------------
// Metrics Computation
// ------------------------------------------------------------

export function computeMetrics(
  resolutions: SolaceResolution[]
): ResolutionMetrics {
  const outcomeDistribution: Record<Outcome, number> =
    {
      success: 0,
      partial: 0,
      setback: 0,
      failure: 0,
      no_roll: 0,
    };

  let pressureLoad = 0;

  for (const r of resolutions) {
    pressureLoad += r.pressures.length;

    if (hasOutcome(r.mechanical_resolution)) {
      const outcome =
        r.mechanical_resolution.outcome;

      outcomeDistribution[outcome] += 1;
    }
  }

  const survivalLength = resolutions.length;

  // Entropy proxy:
  // - diversity of outcomes
  // - accumulated pressure exposure
  const uniqueOutcomes = Object.values(
    outcomeDistribution
  ).filter((v) => v > 0).length;

  const entropyScore =
    uniqueOutcomes * pressureLoad;

  return {
    survivalLength,
    entropyScore,
    pressureLoad,
    outcomeDistribution,
  };
}

/* ------------------------------------------------------------
   EOF
   Notes:
   - No assumptions about mechanical variants
   - No schema mutation
   - One narrowing point prevents cascading errors
------------------------------------------------------------ */
