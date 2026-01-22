// ------------------------------------------------------------
// Solace Resolution Timeline
// ------------------------------------------------------------
// Turn-by-Turn Visualization Model
//
// Purpose:
// - Provide ordered, render-ready timeline data
// - Preserve canonical sequence
// - Support UI timelines, scrubbing, and replay
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export interface TimelineEntry {
  turn: number;
  opening: string;
  outcome: string;
  pressures: string[];
  hasDeath: boolean;
}

export function buildResolutionTimeline(
  resolutions: SolaceResolution[]
): TimelineEntry[] {
  return resolutions.map((r, index) => ({
    turn: index + 1,
    opening: r.opening_signal,
    outcome: r.mechanical_resolution.outcome,
    pressures: r.pressures,
    hasDeath: r.aftermath.some((l) =>
      l.toLowerCase().includes("death")
    ),
  }));
}
