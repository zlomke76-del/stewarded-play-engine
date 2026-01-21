// ------------------------------------------------------------
// Cave Traversal Pressure
// ------------------------------------------------------------
// Depth-based pressure model for caves.
// Going deeper quietly worsens everything.
// No UI. No events. Just gravity.
// ------------------------------------------------------------

// 🔧 FIX: import CaveNode from WindscarCave
import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CavePressureResult = {
  pressureScore: number; // cumulative, abstract
  hazardShift: {
    collapseDelta?: number;
    floodDelta?: number;
  };
  entropyDelta: number;
  narrativeHint?: string;
};

/* ------------------------------------------------------------
   Depth Pressure Rules
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
 * Called whenever the tribe occupies or remains in a cave node.
 */
export function applyCaveTraversalPressure(
  node: CaveNode,
  priorPressure = 0
): CavePressureResult {
  const rule = DepthPressure[node.depth];

  const pressureScore = priorPressure + rule.pressure;

  const hazardShift = {
    collapseDelta:
      rule.collapse > 0 ? rule.collapse : undefined,
    floodDelta:
      rule.flood > 0 ? rule.flood : undefined,
  };

  return {
    pressureScore,
    hazardShift,
    entropyDelta: rule.entropy,
    narrativeHint: rule.hint,
  };
}
