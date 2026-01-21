// ------------------------------------------------------------
// Shared Cave Types (Authoritative)
// ------------------------------------------------------------

export type CaveNodeState = "used" | "smoked" | "sacred";

export type CaveHazards = {
  collapseRisk: number; // 0–100
  floodRisk?: number;   // 0–100
};

export type CaveNode = {
  nodeId: string;
  caveId: string;
  name: string;

  // IMPORTANT: unified for multi-cave worlds
  depth: number;

  traits: string[];
  state: CaveNodeState;
  hazards: CaveHazards;
  connections: string[];
};

export type CaveGraph = {
  caveId: string;
  title: string;
  biome: "wilds" | "underground" | "salt";
  nodes: Record<string, CaveNode>;
  entryNodeId: string;
};
