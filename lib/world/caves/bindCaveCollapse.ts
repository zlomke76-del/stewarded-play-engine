// ------------------------------------------------------------
// Cave Collapse Binder
// ------------------------------------------------------------
// Removes collapsed nodes and severs graph connections
// ------------------------------------------------------------

import type {
  CaveGraph,
  CaveNode,
} from "./types";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CollapseResult = {
  updatedCave: CaveGraph;
  collapsedNodeIds: string[];
};

/* ------------------------------------------------------------
   Core Logic
------------------------------------------------------------ */

export function bindCaveCollapse(
  cave: CaveGraph,
  collapsedNodeId: string
): CollapseResult {
  const collapsedNode = cave.nodes[collapsedNodeId];

  if (!collapsedNode) {
    return {
      updatedCave: cave,
      collapsedNodeIds: [],
    };
  }

  const collapsedNodeIds = [collapsedNodeId];

  // ----------------------------------------------------------
  // Remove collapsed node + sever connections
  // ----------------------------------------------------------

  const remainingNodes: Record<string, CaveNode> = {};

  for (const [id, node] of Object.entries(cave.nodes)) {
    if (id === collapsedNodeId) continue;

    remainingNodes[id] = {
      ...node,
      connections: node.connections.filter(
        (c) => c !== collapsedNodeId
      ),
    };
  }

  // ----------------------------------------------------------
  // Return updated cave graph
  // ----------------------------------------------------------

  return {
    updatedCave: {
      ...cave,
      nodes: remainingNodes,
    },
    collapsedNodeIds,
  };
}
