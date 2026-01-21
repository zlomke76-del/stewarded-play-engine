// ------------------------------------------------------------
// Cave Registry & Migration Table (Canonical)
// ------------------------------------------------------------
// Governs known caves and allowed migrations
// ------------------------------------------------------------

import type { CaveGraph } from "./WindscarCave";
import { WindscarCave } from "./WindscarCave";
import { UnderrootCave } from "./UnderrootCave";

/* ------------------------------------------------------------
   Cave Registry
------------------------------------------------------------ */

export const CaveRegistry: Record<string, CaveGraph> = {
  [WindscarCave.caveId]: WindscarCave,
  [UnderrootCave.caveId]: UnderrootCave,
};

/* ------------------------------------------------------------
   Migration Table
------------------------------------------------------------ */
/**
 * Defines legal one-way cave migrations.
 * These are narrative + survival transitions,
 * not physical tunnels.
 */

export const CaveMigrationTable: Record<
  string,
  {
    to: string;
    reason: "collapse" | "scarcity" | "omen" | "forced";
    description: string;
  }[]
> = {
  "cave-windscar": [
    {
      to: "cave-underroot",
      reason: "collapse",
      description:
        "With Windscar sealed or fouled, the tribe is forced to seek deeper cover beneath the forest roots.",
    },
  ],

  // Underroot → Salt Hollow will be added later
  "cave-underroot": [],
};

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

export function getCaveById(
  caveId: string
): CaveGraph | null {
  return CaveRegistry[caveId] ?? null;
}

export function getAvailableMigrations(
  fromCaveId: string
) {
  return CaveMigrationTable[fromCaveId] ?? [];
}
