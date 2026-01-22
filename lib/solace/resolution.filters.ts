// ------------------------------------------------------------
// Solace Resolution Filters
// ------------------------------------------------------------
// Pressure / Outcome Slicing Utilities
//
// Purpose:
// - Enable focused analysis and UI filtering
// - Never mutate source data
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export function filterByOutcome(
  resolutions: SolaceResolution[],
  outcome: SolaceResolution["mechanical_resolution"]["outcome"]
): SolaceResolution[] {
  return resolutions.filter(
    (r) => r.mechanical_resolution.outcome === outcome
  );
}

export function filterByPressure(
  resolutions: SolaceResolution[],
  pressureFragment: string
): SolaceResolution[] {
  const needle = pressureFragment.toLowerCase();
  return resolutions.filter((r) =>
    r.pressures.some((p) =>
      p.toLowerCase().includes(needle)
    )
  );
}

export function filterTerminalRuns(
  resolutions: SolaceResolution[]
): SolaceResolution[] {
  return resolutions.filter((r) =>
    r.aftermath.some((l) =>
      l.toLowerCase().includes("death")
    )
  );
}
