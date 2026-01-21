// ------------------------------------------------------------
// Cave Traversal Pressure
// ------------------------------------------------------------
// Computes traversal pressure based on depth, hazards,
// and structural degradation.
// ------------------------------------------------------------

import type { CaveNode } from "./types";

/* ------------------------------------------------------------
   Constants
------------------------------------------------------------ */

const BASE_PRESSURE = 5;

/* ------------------------------------------------------------
   Traversal Pressure
------------------------------------------------------------ */

export function computeTraversalPressure(
  node: CaveNode
): number {
  let pressure = BASE_PRESSURE;

  // Depth increases strain
  pressure += node.depth * 5;

  // Structural risk contributes even if inert
  pressure += Math.floor(
    node.hazards.collapseRisk / 10
  );

  // Flood risk (if present)
  if (node.hazards.floodRisk) {
    pressure += Math.floor(
      node.hazards.floodRisk / 15
    );
  }

  return pressure;
}
