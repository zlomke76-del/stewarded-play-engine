// ------------------------------------------------------------
// Cave Omen Ladder
// ------------------------------------------------------------
// Gradual pre-disaster signaling for caves.
// Collapse and flood never occur without omens.
// Omens escalate, mutate, then fall silent.
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave.types";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type OmenType = "collapse" | "flood";

export type OmenStage =
  | "none"
  | "early"
  | "warning"
  | "imminent"
  | "silence"; // the wrong silence

export type OmenResult = {
  type: OmenType;
  stage: OmenStage;
  line?: string; // omitted entirely if silence
};

/* ------------------------------------------------------------
   Thresholds
------------------------------------------------------------ */

const OmenThresholds = {
  collapse: {
    early: 20,
    warning: 40,
    imminent: 65,
    silence: 85,
  },
  flood: {
    early: 15,
    warning: 35,
    imminent: 60,
    silence: 80,
  },
};

/* ------------------------------------------------------------
   Sentence Pools (Canonical)
------------------------------------------------------------ */

const CollapseOmens: Record<OmenStage, string[]> = {
  none: [],

  early: [
    "Dust falls where no hand touched the stone.",
    "A fine grit coats the floor, newly disturbed.",
    "The ceiling answers footsteps with a soft reply.",
  ],

  warning: [
    "A hairline crack creeps along the stone.",
    "Pebbles skitter down the wall without cause.",
    "The cave breathes out dust when the wind shifts.",
  ],

  imminent: [
    "The stone groans, deep and slow.",
    "Something above shifts its weight.",
    "A fracture speaks, then goes quiet.",
  ],

  silence: [
    "The cave holds its breath.",
    "No sound follows the movement.",
  ],
};

const FloodOmens: Record<OmenStage, string[]> = {
  none: [],

  early: [
    "The floor darkens where it was dry before.",
    "Cold damp clings to the lower stones.",
    "Water smells stronger here.",
  ],

  warning: [
    "A thin trickle threads through the cracks.",
    "The ground drinks faster than before.",
    "Footprints fill in behind you.",
  ],

  imminent: [
    "Water whispers beneath the stone.",
    "The air grows heavy and wet.",
    "A distant surge answers no echo.",
  ],

  silence: [
    "The dampness stops spreading.",
    "The drip ceases entirely.",
  ],
};

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

function pick(list: string[]): string | undefined {
  if (!list.length) return undefined;
  return list[Math.floor(Math.random() * list.length)];
}

function stageForRisk(
  risk: number,
  thresholds: typeof OmenThresholds.collapse
): OmenStage {
  if (risk >= thresholds.silence) return "silence";
  if (risk >= thresholds.imminent) return "imminent";
  if (risk >= thresholds.warning) return "warning";
  if (risk >= thresholds.early) return "early";
  return "none";
}

/* ------------------------------------------------------------
   Core API
------------------------------------------------------------ */

/**
 * Returns an omen line (or silence) for the current cave node.
 * This does NOT trigger events — it only signals.
 */
export function getCaveOmen(
  node: CaveNode
): OmenResult | null {
  const { hazards } = node;

  // Collapse omen
  if (hazards.collapseRisk !== undefined) {
    const stage = stageForRisk(
      hazards.collapseRisk,
      OmenThresholds.collapse
    );

    if (stage !== "none") {
      const line =
        stage === "silence"
          ? undefined
          : pick(CollapseOmens[stage]);

      return {
        type: "collapse",
        stage,
        line,
      };
    }
  }

  // Flood omen
  if (hazards.floodRisk !== undefined) {
    const stage = stageForRisk(
      hazards.floodRisk,
      OmenThresholds.flood
    );

    if (stage !== "none") {
      const line =
        stage === "silence"
          ? undefined
          : pick(FloodOmens[stage]);

      return {
        type: "flood",
        stage,
        line,
      };
    }
  }

  return null;
}
