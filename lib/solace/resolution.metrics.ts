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

export interface ResolutionMetrics {
  survivalLength: number;
  entropyScore: number;
  pressureLoad: number;
  outcomeDistribution: Record<string, number>;
}

export function computeMetrics(
  resolutions: SolaceResolution[]
): ResolutionMetrics {
  const outcomeDistribution: Record<string, number> = {};
  let pressureLoad = 0;

  for (const r of resolutions) {
    const outcome =
      r.mechanical_resolution.outcome;

    outcomeDistribution[outcome] =
      (outcomeDistribution[outcome] || 0) + 1;

    pressureLoad += r.pressures.length;
  }

  const survivalLength = resolutions.length;

  // Simple entropy proxy:
  // more mixed outcomes + more pressures = higher entropy
  const uniqueOutcomes = Object.keys(
    outcomeDistribution
  ).length;

  const entropyScore =
    uniqueOutcomes * pressureLoad;

  return {
    survivalLength,
    entropyScore,
    pressureLoad,
    outcomeDistribution,
  };
}
