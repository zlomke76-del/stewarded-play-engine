// ------------------------------------------------------------
// Forced Exit → Cave Migration Resolver
// ------------------------------------------------------------
// Converts forced cave exits into narrative migrations
// ------------------------------------------------------------

import type { CaveGraph } from "./WindscarCave";
import type { CaveHazardEvent } from "./bindEntropyToHazards";
import {
  CaveMigrationTable,
  getCaveById,
} from "./caveRegistry";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveMigrationResult =
  | {
      type: "migrate";
      fromCaveId: string;
      toCaveId: string;
      reason: "collapse" | "scarcity" | "omen" | "forced";
      description: string;
      destination: CaveGraph;
    }
  | {
      type: "no-migration";
      reason: string;
    };

/* ------------------------------------------------------------
   Resolver
------------------------------------------------------------ */

export function resolveCaveMigration(
  cave: CaveGraph,
  hazardEvent: CaveHazardEvent
): CaveMigrationResult {
  if (!hazardEvent) {
    return {
      type: "no-migration",
      reason: "No hazard event occurred.",
    };
  }

  // Only certain hazards can force migration
  if (
    hazardEvent.type !== "collapse" &&
    hazardEvent.type !== "flood"
  ) {
    return {
      type: "no-migration",
      reason: "Hazard does not force migration.",
    };
  }

  const migrations =
    CaveMigrationTable[cave.caveId] ?? [];

  if (migrations.length === 0) {
    return {
      type: "no-migration",
      reason: "No registered migrations from this cave.",
    };
  }

  // Match migration by hazard reason
  const match = migrations.find(
    (m) => m.reason === hazardEvent.type
  );

  if (!match) {
    return {
      type: "no-migration",
      reason:
        "No migration matches this hazard type.",
    };
  }

  const destination = getCaveById(match.to);

  if (!destination) {
    return {
      type: "no-migration",
      reason:
        "Migration destination is missing from registry.",
    };
  }

  return {
    type: "migrate",
    fromCaveId: cave.caveId,
    toCaveId: destination.caveId,
    reason: match.reason,
    description: match.description,
    destination,
  };
}
