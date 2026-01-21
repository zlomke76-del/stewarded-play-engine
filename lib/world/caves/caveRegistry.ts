// ------------------------------------------------------------
// Cave Registry
// ------------------------------------------------------------
// Canonical cave lookup & migration base
// ------------------------------------------------------------

import type { CaveGraph } from "./types";

import { WindscarCave } from "./WindscarCave";
import { UnderrootCave } from "./UnderrootCave";

/* ------------------------------------------------------------
   Registry
------------------------------------------------------------ */

export const CaveRegistry: Record<string, CaveGraph> = {
  [WindscarCave.caveId]: WindscarCave,
  [UnderrootCave.caveId]: UnderrootCave,
};

/* ------------------------------------------------------------
   Migration Types
------------------------------------------------------------ */

export type CaveMigrationReason =
  | "collapse"
  | "scarcity"
  | "omen"
  | "forced";

export interface CaveMigration {
  reason: CaveMigrationReason;
  to: string;
  description: string;
}

/* ------------------------------------------------------------
   Migration Table
------------------------------------------------------------ */

export const CaveMigrationTable: Record<
  string,
  CaveMigration[]
> = {
  "cave-windscar": [
    {
      reason: "collapse",
      to: "cave-underroot",
      description:
        "The stone ceiling gives way. Smoke and dust drive you deeper underground.",
    },
  ],

  "cave-underroot": [], // terminal until Salt Hollow exists
};

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

export function getCaveById(
  caveId: string
): CaveGraph | undefined {
  return CaveRegistry[caveId];
}
