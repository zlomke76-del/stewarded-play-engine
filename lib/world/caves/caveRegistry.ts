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
   Migration Table
------------------------------------------------------------ */

export const CaveMigrationTable: Record<string, string | null> = {
  "cave-windscar": "cave-underroot",
  "cave-underroot": null, // terminal until Salt Hollow is introduced
};

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

export function getCaveById(
  caveId: string
): CaveGraph | undefined {
  return CaveRegistry[caveId];
}
