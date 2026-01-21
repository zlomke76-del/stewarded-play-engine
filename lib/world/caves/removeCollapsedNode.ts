// ------------------------------------------------------------
// Remove Collapsed Cave Node (AUTHORITATIVE)
// ------------------------------------------------------------
// - Removes collapsed node from graph
// - Severs all inbound / outbound connections
// - Canon-safe (no mutation)
// ------------------------------------------------------------

import type { CaveGraph, CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Result
------------------------------------------------------------ */

export type CollapseGraphResult = {
  updatedGraph: CaveGraph;
  removedNode: CaveNode;
};

/* ------------------------------------------------------------
   Core Logic
------------------------------------------------------------ */

export function removeCollapsedNode(
  graph: CaveGraph,
  collapsedNodeId: string
): CollapseGraphResult {
  const collapsedNode =
    graph.nodes[collapsedNodeId];

  if (!collapsedNode) {
    throw new Error(
      `Collapsed node "${collapsedNodeId}" not found in cave graph`
    );
  }

  /* ----------------------------------------------------------
     Remove node + sever connections
  ---------------------------------------------------------- */

  const updatedNodes: Record<
    string,
    CaveNode
  > = {};

  for (const [id, node] of Object.entries(
    graph.nodes
  )) {
    // Skip the collapsed node entirely
    if (id === collapsedNodeId) continue;

    // Remove references to collapsed node
    const prunedConnections =
      node.connections.filter(
        (connId) => connId !== collapsedNodeId
      );

    updatedNodes[id] = {
      ...node,
      connections: prunedConnections,
    };
  }

  /* ----------------------------------------------------------
     Return new canonical graph
  ---------------------------------------------------------- */

  return {
    removedNode: collapsedNode,
    updatedGraph: {
      ...graph,
      nodes: updatedNodes,
    },
  };
}
