// ------------------------------------------------------------
// Omen Ladder — Collapse / Flood Escalation
// ------------------------------------------------------------
// Generates escalating omen phrasing as cave hazards rise.
// Used *before* collapse or flood events.
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type OmenLevel = 0 | 1 | 2 | 3;

export type OmenResult = {
  level: OmenLevel;
  line: string;
};

/* ------------------------------------------------------------
   Thresholds
------------------------------------------------------------ */

function computeOmenLevel(node: CaveNode): OmenLevel {
  const { collapseRisk, floodRisk = 0 } = node.hazards;

  const danger = Math.max(collapseRisk, floodRisk);

  if (danger < 25) return 0;
  if (danger < 45) return 1;
  if (danger < 65) return 2;
  return 3;
}

/* ------------------------------------------------------------
   Canonical Omen Lines
------------------------------------------------------------ */

const OMEN_LINES: Record<OmenLevel, string[]> = {
  0: [],

  1: [
    "Loose stone shifts when no one moves.",
    "Water sounds closer than it should.",
  ],

  2: [
    "The ceiling sheds grit with every breath.",
    "The cave answers itself in the dark.",
  ],

  3: [
    "The stone holds, but only because it has not decided yet.",
    "The water waits above your head.",
  ],
};

/* ------------------------------------------------------------
   Public API
------------------------------------------------------------ */

export function getCaveOmen(node: CaveNode): OmenResult | null {
  const level = computeOmenLevel(node);
  if (level === 0) return null;

  const lines = OMEN_LINES[level];
  const line =
    lines[Math.floor(Math.random() * lines.length)];

  return { level, line };
}
