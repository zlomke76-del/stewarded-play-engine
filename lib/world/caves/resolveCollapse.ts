// ------------------------------------------------------------
// Collapse Resolution
// ------------------------------------------------------------
// Collapse is irreversible.
// No structural flags.
// Meaning is carried by:
// - hazards consumed
// - connections severed
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Collapse Resolver
------------------------------------------------------------ */

export function resolveCollapse(
  node: CaveNode
): CaveNode {
  return {
    ...node,

    // 🔒 Hazards fully consumed
    hazards: {
      collapseRisk: 0,
      floodRisk: 0,
    },

    // 🔒 No traversal possible
    connections: [],
  };
}
