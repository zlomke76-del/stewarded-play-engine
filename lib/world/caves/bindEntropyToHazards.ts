// ------------------------------------------------------------
// Entropy → Cave Hazard Binding
// ------------------------------------------------------------
// Governs irreversible cave events
// Collapse / Flood trigger exactly once
// Topology mutation is signaled, not executed here
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveHazardEvent =
  | {
      type: "collapse";
      severity: "partial" | "total";
      description: string;
      blockedNodeIds: string[];
      forcedExitNodeId?: string;
    }
  | {
      type: "flood";
      severity: "slow" | "surge";
      description: string;
    }
  | null;

export type HazardBindingResult = {
  updatedNode: CaveNode;
  triggeredEvent: CaveHazardEvent;
  suppressOmens: boolean;
};

/* ------------------------------------------------------------
   Thresholds (Canonical)
------------------------------------------------------------ */

const COLLAPSE_THRESHOLD = 70;
const FLOOD_THRESHOLD = 60;

/* ------------------------------------------------------------
   Core Binder
------------------------------------------------------------ */

export function bindEntropyToHazards(
  node: CaveNode,
  entropy: number
): HazardBindingResult {
  let triggeredEvent: CaveHazardEvent = null;
  let suppressOmens = false;

  // Defensive clone — never mutate canon input
  const updatedNode: CaveNode = {
    ...node,
    hazards: { ...node.hazards },
    connections: [...node.connections],
  };

  /* ----------------------------------------------------------
     Collapse Logic (Terminal)
  ---------------------------------------------------------- */

  if (
    updatedNode.hazards.collapseRisk > 0 &&
    entropy >= COLLAPSE_THRESHOLD
  ) {
    const total = entropy > 90;

    // All outgoing connections are now invalid
    const blockedNodeIds = [...updatedNode.connections];

    // Forced exit only if not surface
    const forcedExitNodeId =
      updatedNode.depth > 0
        ? updatedNode.connections[0]
        : undefined;

    triggeredEvent = {
      type: "collapse",
      severity: total ? "total" : "partial",
      description: total
        ? "The ceiling gives way without warning. Stone seals the dark."
        : "A thunderous crack — dust and stone choke the passage.",
      blockedNodeIds,
      forcedExitNodeId,
    };

    // 🔒 Collapse is terminal for this node
    updatedNode.hazards.collapseRisk = 0;
    updatedNode.hazards.floodRisk = 0;
    updatedNode.connections = [];

    suppressOmens = true;

    return {
      updatedNode,
      triggeredEvent,
      suppressOmens,
    };
  }

  /* ----------------------------------------------------------
     Flood Logic (Consumes Itself)
  ---------------------------------------------------------- */

  if (
    typeof updatedNode.hazards.floodRisk === "number" &&
    updatedNode.hazards.floodRisk > 0 &&
    entropy >= FLOOD_THRESHOLD
  ) {
    const surge = entropy > 80;

    triggeredEvent = {
      type: "flood",
      severity: surge ? "surge" : "slow",
      description: surge
        ? "Cold water surges through the chamber, roaring and blind."
        : "Water begins to creep along the stone floor.",
    };

    // 🔒 Flood resolves once
    updatedNode.hazards.floodRisk = 0;

    suppressOmens = true;

    return {
      updatedNode,
      triggeredEvent,
      suppressOmens,
    };
  }

  /* ----------------------------------------------------------
     No Trigger
  ---------------------------------------------------------- */

  return {
    updatedNode,
    triggeredEvent: null,
    suppressOmens: false,
  };
}
