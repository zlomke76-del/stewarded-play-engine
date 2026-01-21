// ------------------------------------------------------------
// Underroot Cave — Stub Graph
// ------------------------------------------------------------
// Second cave in migration chain:
// Windscar → Underroot → Salt Hollow
//
// ⚠ Stub only — no hazards, no narration pools yet
// ------------------------------------------------------------

export type CaveNodeState = "used" | "smoked" | "sacred";

export type CaveHazards = {
  collapseRisk?: number;
  floodRisk?: number;
};

export type CaveNode = {
  nodeId: string;
  caveId: string;
  name: string;
  depth: number;
  traits: string[];
  state: CaveNodeState;
  hazards: CaveHazards;
  connections: string[];
};

export type CaveGraph = {
  caveId: string;
  title: string;
  biome: "wilds";
  nodes: Record<string, CaveNode>;
  entryNodeId: string;
};

/* ------------------------------------------------------------
   Underroot Cave (Stub)
------------------------------------------------------------ */

export const UnderrootCave: CaveGraph = {
  caveId: "cave-underroot",
  title: "Underroot Cave",
  biome: "wilds",
  entryNodeId: "underroot-entry",

  nodes: {
    // --------------------------------------------------------
    // Depth 0 — Root-Choked Entry
    // --------------------------------------------------------
    "underroot-entry": {
      nodeId: "underroot-entry",
      caveId: "cave-underroot",
      name: "Root-Choked Entry",
      depth: 0,
      traits: [
        "roots",
        "low-ceiling",
        "damp",
        "concealed",
      ],
      state: "used",
      hazards: {}, // no hazards yet
      connections: [
        "underroot-hollow",
      ],
    },

    // --------------------------------------------------------
    // Depth 1 — Buried Hollow
    // --------------------------------------------------------
    "underroot-hollow": {
      nodeId: "underroot-hollow",
      caveId: "cave-underroot",
      name: "Buried Hollow",
      depth: 1,
      traits: [
        "tight",
        "earth-scent",
        "quiet",
      ],
      state: "used",
      hazards: {}, // no hazards yet
      connections: [
        "underroot-entry",
      ],
    },
  },
};
