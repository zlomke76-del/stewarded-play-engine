// ------------------------------------------------------------
// Cave Collapse / Flood Binding
// ------------------------------------------------------------
// Purpose:
// - Convert accumulated hazard pressure into irreversible events
// - Trigger collapse or flood once thresholds are crossed
// - Permanently suppress future omens after trigger
// - Mutate cave node state (canonical world change)
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveFailureResult = {
  collapsed: boolean;
  flooded: boolean;
  reason?: string;
};

export type CavePressureContext = {
  node: CaveNode;
  turn: number;

  // Dynamic pressure signals
  fireUsed: boolean;
  rested: boolean;
  successfulHunt: boolean;
};

/* ------------------------------------------------------------
   Thresholds (Hard Canon)
------------------------------------------------------------ */

const COLLAPSE_THRESHOLD = 70;
const FLOOD_THRESHOLD = 65;

/* ------------------------------------------------------------
   Pressure Accumulation
------------------------------------------------------------ */

function accumulatePressure(
  node: CaveNode,
  ctx: CavePressureContext
) {
  let collapse = node.hazards.collapseRisk;
  let flood = node.hazards.floodRisk ?? 0;

  // 🔥 Fire weakens stone over time
  if (ctx.fireUsed) {
    collapse += 10;
    flood += 5;
  }

  // 💤 Resting concentrates pressure
  if (ctx.rested) {
    collapse += 5;
  }

  // 🐗 Successful hunts draw predators / movement
  if (ctx.successfulHunt) {
    collapse += 5;
    flood += 5;
  }

  // ⏳ Time always works against stone
  collapse += Math.min(ctx.turn, 5);
  flood += Math.min(ctx.turn, 3);

  return { collapse, flood };
}

/* ------------------------------------------------------------
   Binding Function
------------------------------------------------------------ */

export function bindCaveCollapse(
  ctx: CavePressureContext
): CaveFailureResult {
  const { node } = ctx;

  // 🔒 Already failed → permanent
  if ((node as any).collapsed) {
    return { collapsed: true, flooded: false };
  }

  if ((node as any).flooded) {
    return { collapsed: false, flooded: true };
  }

  const pressure = accumulatePressure(node, ctx);

  // 💥 Collapse has priority over flood
  if (pressure.collapse >= COLLAPSE_THRESHOLD) {
    (node as any).collapsed = true;

    return {
      collapsed: true,
      flooded: false,
      reason:
        "The stone gives way. What held the cave together fails at once.",
    };
  }

  // 🌊 Flood follows
  if (
    node.hazards.floodRisk !== undefined &&
    pressure.flood >= FLOOD_THRESHOLD
  ) {
    (node as any).flooded = true;

    return {
      collapsed: false,
      flooded: true,
      reason:
        "Water forces its way through the dark. The cave no longer holds air.",
    };
  }

  return {
    collapsed: false,
    flooded: false,
  };
}
