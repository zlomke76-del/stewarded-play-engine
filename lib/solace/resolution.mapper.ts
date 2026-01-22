// ------------------------------------------------------------
// Solace Resolution Mapper
// ------------------------------------------------------------
// Legacy / internal payload → canonical SolaceResolution + WorldDelta
//
// Invariants:
// - Missing fields are VALID
// - Mapper normalizes only
// - Never destructure optional data
// - Never assume arrays exist
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

// ------------------------------------------------------------
// World Delta (explicit, append-only effects)
// ------------------------------------------------------------

export type WorldDelta = {
  territory?: {
    claimed?: string;
    contested?: boolean;
  };

  resources?: {
    food?: number;
    fire?: number;
    stamina?: number;
  };

  discoveries?: string[];
  pressure?: {
    increase?: number;
    decrease?: number;
    source?: string;
  };
  signals?: string[];
  losses?: {
    party?: string;
    count: number;
  }[];
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function safeArray(
  value: unknown
): string[] {
  return Array.isArray(value) ? value : [];
}

// ------------------------------------------------------------
// Mapper
// ------------------------------------------------------------

export function mapToSolaceResolution(input: any): {
  resolution: SolaceResolution;
  world_delta: WorldDelta;
} {
  // ----------------------------------------------------------
  // SAFE mechanical normalization
  // ----------------------------------------------------------

  const mech = input?.mechanical_resolution;

  const roll =
    typeof mech?.roll === "number" ? mech.roll : null;

  const dc =
    typeof mech?.dc === "number" ? mech.dc : null;

  const outcome =
    typeof mech?.outcome === "string"
      ? mech.outcome
      : "no_roll";

  // ----------------------------------------------------------
  // World Delta (mechanics only)
  // ----------------------------------------------------------

  const world_delta: WorldDelta = {};

  if (roll !== null && dc !== null) {
    if (roll >= dc) {
      world_delta.territory = {
        claimed: "current_location",
      };
      world_delta.pressure = {
        decrease: 1,
        source: "decisive action",
      };
    } else {
      world_delta.pressure = {
        increase: 1,
        source: "environmental resistance",
      };
    }
  }

  // ----------------------------------------------------------
  // Canonical Resolution (ALL FIELDS GUARDED)
  // ----------------------------------------------------------

  const resolution: SolaceResolution = {
    opening_signal:
      typeof input?.opening_signal === "string"
        ? input.opening_signal
        : "The moment resolves.",

    situation_frame: safeArray(
      input?.situation_frame
    ).slice(0, 3),

    pressures: safeArray(
      input?.pressures
    ).slice(0, 4),

    process: safeArray(
      input?.process
    ).slice(0, 4),

    mechanical_resolution: {
      roll,
      dc,
      outcome,
    },

    aftermath: safeArray(
      input?.aftermath
    ).slice(0, 4),
  };

  return {
    resolution,
    world_delta,
  };
}
