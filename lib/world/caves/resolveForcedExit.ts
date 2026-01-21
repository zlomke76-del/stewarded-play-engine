// ------------------------------------------------------------
// Forced Exit Resolver
// ------------------------------------------------------------
// If a cave node collapses while occupied,
// the player is either ejected or buried.
// Topology alone decides.
// ------------------------------------------------------------

import type { CaveGraph, CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Result Types
------------------------------------------------------------ */

export type ForcedExitResult =
  | {
      outcome: "ejected";
      fromNodeId: string;
      toNodeId: string;
      description: string;
    }
  | {
      outcome: "buried";
      nodeId: string;
      description: string;
    }
  | null;

/* ------------------------------------------------------------
   Resolver
------------------------------------------------------------ */

export function resolveForcedExit(
  cave: CaveGraph,
  collapsedNodeId: string,
  playerNodeId: string
): ForcedExitResult {
  // Player not inside collapsing node → no action
  if (collapsedNodeId !== playerNodeId) {
    return null;
  }

  const collapsedNode: CaveNode | undefined =
    cave.nodes[collapsedNodeId];

  if (!collapsedNode) {
    return null;
  }

  const remainingConnections = collapsedNode.connections;

  // ----------------------------------------------------------
  // Forced Ejection
  // ----------------------------------------------------------

  if (remainingConnections.length > 0) {
    const exitNodeId = remainingConnections[0]; // deterministic

    return {
      outcome: "ejected",
      fromNodeId: collapsedNodeId,
      toNodeId: exitNodeId,
      description:
        "The stone breaks loose — you are thrown clear as the passage seals behind you.",
    };
  }

  // ----------------------------------------------------------
  // Burial (Terminal)
  // ----------------------------------------------------------

  return {
    outcome: "buried",
    nodeId: collapsedNodeId,
    description:
      "The cave gives no path. Stone closes. There is no exit.",
  };
}
