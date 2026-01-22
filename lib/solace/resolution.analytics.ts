// ------------------------------------------------------------
// Solace Resolution Analytics
// ------------------------------------------------------------
// Pressure Frequency + Death Cause Tracking
//
// Purpose:
// - Analyze canonical resolutions
// - Surface long-run pressure patterns
// - Identify terminal causes
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export interface ResolutionAnalytics {
  totalTurns: number;
  pressureFrequency: Record<string, number>;
  outcomeCounts: Record<string, number>;
  deathCauses: Record<string, number>;
}

function hasOutcome(
  m: SolaceResolution["mechanical_resolution"]
): m is {
  roll: number;
  dc: number;
  outcome: string;
} {
  return (
    typeof (m as any).outcome === "string"
  );
}

export function analyzeResolutions(
  resolutions: SolaceResolution[]
): ResolutionAnalytics {
  const analytics: ResolutionAnalytics = {
    totalTurns: resolutions.length,
    pressureFrequency: {},
    outcomeCounts: {},
    deathCauses: {},
  };

  for (const r of resolutions) {
    // --------------------------------------------
    // Pressure frequency
    // --------------------------------------------
    for (const p of r.pressures) {
      analytics.pressureFrequency[p] =
        (analytics.pressureFrequency[p] || 0) + 1;
    }

    // --------------------------------------------
    // Outcome counts (dice-only, observational)
    // --------------------------------------------
    let outcomeKey = "non_dice";

    if (hasOutcome(r.mechanical_resolution)) {
      outcomeKey = r.mechanical_resolution.outcome;
    }

    analytics.outcomeCounts[outcomeKey] =
      (analytics.outcomeCounts[outcomeKey] || 0) + 1;

    // --------------------------------------------
    // Death cause detection (narrative heuristic)
    // --------------------------------------------
    if (
      outcomeKey === "failure" &&
      r.aftermath.some((l) =>
        l.toLowerCase().includes("death")
      )
    ) {
      analytics.deathCauses["unspecified"] =
        (analytics.deathCauses["unspecified"] || 0) +
        1;
    }
  }

  return analytics;
}
