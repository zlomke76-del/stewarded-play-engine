import type { CaveNode } from "./WindscarCave";

export function resolveCollapse(node: CaveNode): {
  updatedNode: CaveNode;
  forcedExitNodeId?: string;
} {
  const updated: CaveNode = {
    ...node,
    structuralState: "collapsed",
    hazards: {
      collapseRisk: 0,
      floodRisk: 0,
    },
    connections: [],
  };

  // Forced exit if not at surface
  const forcedExit =
    node.depth > 0
      ? node.connections.find((id) => id !== node.nodeId)
      : undefined;

  return {
    updatedNode: updated,
    forcedExitNodeId: forcedExit,
  };
}
