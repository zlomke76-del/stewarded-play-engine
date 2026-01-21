// ------------------------------------------------------------
// Cave Registry
// ------------------------------------------------------------
// Canonical cave lookup & migration base
// ------------------------------------------------------------

import type { CaveGraph } from "./types";

import { WindscarCave } from "./WindscarCave";
import { UnderrootCave } from "./UnderrootCave";
import { SaltHollowCave } from "./SaltHollowCave";

/* ------------------------------------------------------------
   Registry
------------------------------------------------------------ */

export const CaveRegistry: Record<string, CaveGraph> = {
  [WindscarCave.caveId]: WindscarCave,
  [UnderrootCave.caveId]: UnderrootCave,
  [SaltHollowCave.caveId]: SaltHollowCave,
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
        "The ceiling gives way. Smoke and dust force you deeper underground.",
    },
  ],

  "cave-underroot": [
    {
      reason: "flood",
      to: "cave-salthollow",
      description:
        "Water fills the root tunnels. Bitter air draws you toward a pale hollow beyond.",
    },
  ],

  "cave-salthollow": [], // terminal
};

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

export function getCaveById(
  caveId: string
): CaveGraph | undefined {
  return CaveRegistry[caveId];
}
