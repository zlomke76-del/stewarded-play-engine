// ------------------------------------------------------------
// Cave Traversal Pressure
// ------------------------------------------------------------
// Depth-based pressure model for caves.
// Going deeper quietly worsens everything.
// No UI. No events. Just gravity.
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave.types";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CavePressureResult = {
  pressureScore: number; // abstract, cumulative
  hazardShift: {
    collapseDelta?: number;
    floodDelta?: number;
  };
  entropyDelta: number;
  narrativeHint?: string;
};

/* ------------------------------------------------------------
   Constants
------------------------------------------------------------ */

const DepthPressure = {
  0: {
    pressure: 0,
    entropy: 0,
    collapse: 0,
    flood: 0,
    hint: undefined,
  },

  1: {
    pressure: 2,
    entropy: 1,
    collapse: 5,
    flood: 0,
    hint: "The cave answers sound more slowly here.",
  },

  2: {
    pressure: 5,
    entropy: 3,
    collapse: 10,
    flood: 8,
    hint: "The cave no longer feels empty.",
  },
} as const;

/* ------------------------------------------------------------
   Core Logic
------------------------------------------------------------ */

/**
 * Applies traversal pressure based on cave depth.
 * Called whenever the tribe occupies or moves within a cave node.
 */
export function applyCaveTraversalPressure(
  node: CaveNode,
  priorPressure = 0
): CavePressureResult {
  const depthRule = DepthPressure[node.depth];

  const pressureScore =
    priorPressure + depthRule.pressure;

  const hazardShift = {
    collapseDelta: depthRule.collapse
      ? depthRule.collapse
      : undefined,
    floodDelta: depthRule.flood
      ? depthRule.flood
      : undefined,
  };

  const entropyDelta = depthRule.entropy;

  return {
    pressureScore,
    hazardShift,
    entropyDelta,
    narrativeHint: depthRule.hint,
  };
}
