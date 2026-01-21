// ------------------------------------------------------------
// Windscar Cave — Seeded World Graph
// ------------------------------------------------------------
// Caveman-mode cave topology
// Overhang → Tunnel → Deep Chamber
// ------------------------------------------------------------

import type {
  CaveGraph,
  CaveNode,
} from "./types";

// ------------------------------------------------------------
// Windscar Cave (Canonical Seed)
// ------------------------------------------------------------

export const WindscarCave: CaveGraph = {
  caveId: "cave-windscar",
  title: "Windscar Cave",
  biome: "wilds",
  entryNodeId: "windscar-overhang",

  nodes: {
    // --------------------------------------------------------
    // Depth 0 — Stone Overhang
    // --------------------------------------------------------
    "windscar-overhang": {
      nodeId: "windscar-overhang",
      caveId: "cave-windscar",
      name: "Stone Overhang",
      depth: 0,
      traits: [
        "shelter",
        "concealed",
        "windbreak",
        "rest-safe",
      ],
      state: "used",
      hazards: {
        collapseRisk: 5,
      },
      connections: ["windscar-tunnel"],
    },

    // --------------------------------------------------------
    // Depth 1 — Narrow Tunnel
    // --------------------------------------------------------
    "windscar-tunnel": {
      nodeId: "windscar-tunnel",
      caveId: "cave-windscar",
      name: "Narrow Tunnel",
      depth: 1,
      traits: [
        "narrow",
        "echoing",
        "defensible",
        "dark",
      ],
      state: "used",
      hazards: {
        collapseRisk: 20,
      },
      connections: [
        "windscar-overhang",
        "windscar-deep-chamber",
      ],
    },

    // --------------------------------------------------------
    // Depth 2 — Deep Chamber
    // --------------------------------------------------------
    "windscar-deep-chamber": {
      nodeId: "windscar-deep-chamber",
      caveId: "cave-windscar",
      name: "Deep Chamber",
      depth: 2,
      traits: [
        "dark",
        "damp",
        "ritual-capable",
        "isolated",
      ],
      state: "used",
      hazards: {
        collapseRisk: 35,
        floodRisk: 25,
      },
      connections: ["windscar-tunnel"],
    },
  },
};
