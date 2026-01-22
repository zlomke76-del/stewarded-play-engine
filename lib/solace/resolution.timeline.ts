// ------------------------------------------------------------
// Solace Resolution Timeline
// ------------------------------------------------------------
// Turn-by-Turn Summary View
//
// Purpose:
// - Produce a lightweight timeline for UI or analysis
// - Never assume mechanical structure
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

export interface ResolutionTimelineEntry {
  turn: number;
  opening: string;
  outcome: Outcome | "unknown";
  pressures: string[];
  hasDeath: boolean;
}

// ------------------------------------------------------------
// Type Guard (CORRECT)
// ------------------------------------------------------------

function hasOutcome(
  m: SolaceResolution["mechanical_resolution"]
): m is Extract<
  SolaceResolution["mechanical_resolution"],
  { outcome: Outcome }
> {
  return (
    typeof (m as any)?.outcome === "string"
  );
}

// ------------------------------------------------------------
// Builder
// ------------------------------------------------------------

export function buildResolutionTimeline(
  resolutions: SolaceResolution[]
): ResolutionTimelineEntry[] {
  return resolutions.map((r, index) => {
    const mechanics =
      r.mechanical_resolution;

    return {
      turn: index + 1,
      opening: r.opening_signal,
      outcome: hasOutcome(mechanics)
        ? mechanics.outcome
        : "unknown",
      pressures: r.pressures.filter(
        (p): p is string =>
          typeof p === "string"
      ),
      hasDeath: r.aftermath.some(
        (l) =>
          typeof l === "string" &&
          l.toLowerCase().includes("death")
      ),
    };
  });
}
