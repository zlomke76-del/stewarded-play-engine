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

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type DiceOutcome =
  | "success"
  | "partial"
  | "setback"
  | "failure"
  | "no_roll";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function hasDiceOutcome(
  r: SolaceResolution
): r is SolaceResolution & {
  mechanical_resolution: {
    roll: number;
    dc: number;
    outcome: DiceOutcome;
  };
} {
  const m = r.mechanical_resolution as any;
  return (
    typeof m.roll === "number" &&
    typeof m.dc === "number" &&
    typeof m.outcome === "string"
  );
}

// ------------------------------------------------------------
// Filters
// ------------------------------------------------------------

export function filterByOutcome(
  resolutions: SolaceResolution[],
  outcome: DiceOutcome
): SolaceResolution[] {
  return resolutions.filter(
    (r) =>
      hasDiceOutcome(r) &&
      r.mechanical_resolution.outcome === outcome
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
