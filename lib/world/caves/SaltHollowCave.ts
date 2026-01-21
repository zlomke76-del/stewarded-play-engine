// ------------------------------------------------------------
// Salt Hollow — Terminal Cave
// ------------------------------------------------------------
// Third cave in migration chain:
// Windscar → Underroot → Salt Hollow
// ------------------------------------------------------------

import type { CaveGraph } from "./types";

// ------------------------------------------------------------
// Salt Hollow Cave (Canonical Seed)
// ------------------------------------------------------------

export const SaltHollowCave: CaveGraph = {
  caveId: "cave-salthollow",
  title: "Salt Hollow",
  biome: "wilds",
  entryNodeId: "salthollow-entry",

  nodes: {
    // --------------------------------------------------------
    // Depth 0 — Salt-Stained Threshold
    // --------------------------------------------------------
    "salthollow-entry": {
      nodeId: "salthollow-entry",
      caveId: "cave-salthollow",
      name: "Salt-Stained Threshold",
      depth: 0,
      traits: [
        "mineral-crust",
        "dry",
        "still-air",
        "echo-muted",
      ],
      state: "used",
      hazards: {
        collapseRisk: 0,
      },
      connections: ["salthollow-basin"],
    },

    // --------------------------------------------------------
    // Depth 1 — White Basin
    // --------------------------------------------------------
    "salthollow-basin": {
      nodeId: "salthollow-basin",
      caveId: "cave-salthollow",
      name: "White Basin",
      depth: 1,
      traits: [
        "salt-bed",
        "ritual-capable",
        "preserving",
        "bitter-air",
      ],
      state: "used",
      hazards: {
        collapseRisk: 5,
      },
      connections: ["salthollow-entry"],
    },
  },
};
