// ------------------------------------------------------------
// Entropy → Cave Hazard Binding
// ------------------------------------------------------------
// Governs irreversible cave events
// Collapse / Flood trigger exactly once
// ------------------------------------------------------------

import type {
  CaveNode,
} from "./types";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveHazardEvent =
  | {
      type: "collapse";
      severity: "partial" | "total";
      description: string;
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
  };

  /* ----------------------------------------------------------
     Collapse Logic
  ---------------------------------------------------------- */

  if (
    updatedNode.hazards.collapseRisk > 0 &&
    entropy >= COLLAPSE_THRESHOLD
  ) {
    triggeredEvent = {
      type: "collapse",
      severity:
        entropy > 90 ? "total" : "partial",
      description:
        entropy > 90
          ? "The ceiling gives way without warning. Stone seals the dark."
          : "A thunderous crack — dust and stone choke the passage.",
    };

    // 🔒 Collapse is terminal for this node
    updatedNode.hazards.collapseRisk = 0;
    suppressOmens = true;

    return {
      updatedNode,
      triggeredEvent,
      suppressOmens,
    };
  }

  /* ----------------------------------------------------------
     Flood Logic (only if no collapse)
  ---------------------------------------------------------- */

  if (
    updatedNode.hazards.floodRisk &&
    entropy >= FLOOD_THRESHOLD
  ) {
    triggeredEvent = {
      type: "flood",
      severity:
        entropy > 80 ? "surge" : "slow",
      description:
        entropy > 80
          ? "Cold water surges through the chamber, roaring and blind."
          : "Water begins to creep along the stone floor.",
    };

    // 🔒 Flood consumes itself
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
