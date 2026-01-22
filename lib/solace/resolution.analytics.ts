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
    // Pressure frequency
    for (const p of r.pressures) {
      analytics.pressureFrequency[p] =
        (analytics.pressureFrequency[p] || 0) + 1;
    }

    // Outcome counts
    const outcome =
      r.mechanical_resolution.outcome;
    analytics.outcomeCounts[outcome] =
      (analytics.outcomeCounts[outcome] || 0) + 1;

    // Death cause detection (simple heuristic)
    if (
      outcome === "failure" &&
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
