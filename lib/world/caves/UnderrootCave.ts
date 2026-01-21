// ------------------------------------------------------------
// Underroot Cave — Stub Graph
// ------------------------------------------------------------
// Second cave in migration chain:
// Windscar → Underroot → Salt Hollow
//
// ⚠ Stub only — narration + hazards will be layered later
// ------------------------------------------------------------

import type {
  CaveGraph,
  CaveNode,
} from "./types";

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
      hazards: {
        collapseRisk: 0,     // ✅ REQUIRED (even if inert)
      },
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
      hazards: {
        collapseRisk: 0,     // ✅ REQUIRED
      },
      connections: [
        "underroot-entry",
      ],
    },
  },
};
