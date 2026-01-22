// ------------------------------------------------------------
// Solace Resolution Mapper
// ------------------------------------------------------------
// Legacy / internal payload → canonical SolaceResolution + WorldDelta
//
// Purpose:
// - Normalize resolution outputs
// - Enforce strict schema compliance
// - Derive WORLD EFFECTS explicitly (no prose inference)
// - Mapper MAY translate intent → effects, but MAY NOT invent facts
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
    party?: string; // named subgroup
    count: number;
  }[];
};

// ------------------------------------------------------------
// Mapper
// ------------------------------------------------------------

export function mapToSolaceResolution(input: {
  opening_signal: string;
  situation_frame: string[];
  pressures: string[];
  process: string[];
  mechanical_resolution: {
    roll: number;
    dc: number;
    outcome: "success" | "partial" | "setback" | "failure" | "no_roll";
  };
  aftermath: string[];

  // NEW: optional structured hints from upstream Solace reasoning
  // (still non-authoritative until Arbiter pass later)
  world_hints?: Partial<WorldDelta>;
}): {
  resolution: SolaceResolution;
  world_delta: WorldDelta;
} {
  const { roll, dc, outcome } = input.mechanical_resolution;

  // ------------------------------------------------------------
  // World Delta Derivation (STRICT, MECHANICAL)
  // ------------------------------------------------------------

  const world_delta: WorldDelta = {
    discoveries: [],
    signals: [],
    losses: [],
  };

  // Success / Setback interpretation rules
  if (roll >= dc) {
    // SUCCESS: gains without cost
    world_delta.territory = { claimed: "current_location" };
    world_delta.pressure = { decrease: 1, source: "decisive action" };
  } else {
    // SETBACK: gains with pressure, no nullification
    world_delta.pressure = { increase: 1, source: "environmental resistance" };
  }

  // Merge any upstream hints (guarded, never overriding mechanics)
  if (input.world_hints) {
    if (input.world_hints.resources) {
      world_delta.resources = {
        ...world_delta.resources,
        ...input.world_hints.resources,
      };
    }

    if (input.world_hints.discoveries) {
      world_delta.discoveries?.push(
        ...input.world_hints.discoveries
      );
    }

    if (input.world_hints.signals) {
      world_delta.signals?.push(
        ...input.world_hints.signals
      );
    }

    if (input.world_hints.losses) {
      world_delta.losses?.push(
        ...input.world_hints.losses
      );
    }
  }

  // ------------------------------------------------------------
  // Canonical Resolution (Narrative-agnostic)
  // ------------------------------------------------------------

  const resolution: SolaceResolution = {
    opening_signal: input.opening_signal,

    situation_frame: input.situation_frame.slice(0, 3),

    pressures: input.pressures.slice(0, 4),

    process: input.process.slice(0, 4),

    mechanical_resolution: {
      roll,
      dc,
      outcome,
    },

    aftermath: input.aftermath.slice(0, 4),
  };

  return {
    resolution,
    world_delta,
  };
}
