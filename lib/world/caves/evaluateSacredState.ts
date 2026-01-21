// ------------------------------------------------------------
// Sacred State Evaluation
// ------------------------------------------------------------
// A cave becomes sacred ONLY when:
// - All nodes are collapsed or blocked
// - No traversal remains possible
// ------------------------------------------------------------

import type { CaveGraph, CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

function isNodeCollapsedOrBlocked(
  node: CaveNode
): boolean {
  const collapseConsumed =
    node.hazards.collapseRisk === 0;

  const noConnections =
    node.connections.length === 0;

  return collapseConsumed && noConnections;
}

/* ------------------------------------------------------------
   Sacred Evaluation
------------------------------------------------------------ */

export function evaluateSacredState(
  cave: CaveGraph
): boolean {
  return Object.values(cave.nodes).every(
    (node) =>
      isNodeCollapsedOrBlocked(node)
  );
}
