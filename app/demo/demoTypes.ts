// app/demo/demoTypes.ts

import type { MapMarkKind } from "@/components/world/ExplorationMapPanel";

export type DMMode = "human" | "solace-neutral";
export type OptionKind = "safe" | "environmental" | "risky" | "contested";

// Keep local dice types aligned with ResolutionDraftAdvisoryPanel
export type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
export type RollSource = "manual" | "solace";

export type InitialTable = {
  openingFrame: string;
  locationTraits: string[];
  latentFactions: {
    name: string;
    desire: string;
    pressure: string;
  }[];
  environmentalOddities: string[];
  dormantHooks: string[];
};

export type XY = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

export type ExplorationDraft = {
  enableMove: boolean;
  direction: Direction | "none";
  enableReveal: boolean;
  revealRadius: 0 | 1 | 2;
  enableMark: boolean;
  markKind: MapMarkKind;
  markNote: string;
};

export type DemoSectionId =
  | "mode"
  | "party"
  | "table"
  | "pressure"
  | "map"
  | "combat"
  | "action"
  | "resolution"
  | "canon"
  | "ledger";
