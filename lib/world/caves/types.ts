// ------------------------------------------------------------
// Canonical Cave Types
// Single Source of Truth
// ------------------------------------------------------------

export type CaveNodeState =
  | "unused"
  | "used"
  | "collapsed"
  | "flooded";

export interface CaveHazards {
  collapseRisk: number;
  floodRisk?: number;
}

export interface CaveNode {
  nodeId: string;
  caveId: string;
  name: string;
  depth: number;
  traits: string[];
  state: CaveNodeState;
  hazards: CaveHazards;
  connections: string[];
}

export interface CaveGraph {
  caveId: string;
  title: string;
  biome: string;
  entryNodeId: string;
  nodes: Record<string, CaveNode>;
}
