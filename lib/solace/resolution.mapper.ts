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
    party?: string;
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
  mechanical_resolution?: {
    roll?: number;
    dc?: number;
    outcome?: "success" | "partial" | "setback" | "failure" | "no_roll";
  };
  aftermath: string[];

  // Optional structured hints (non-authoritative)
  world_hints?: Partial<WorldDelta>;
}): {
  resolution: SolaceResolution;
  world_delta: WorldDelta;
} {
  // ------------------------------------------------------------
  // SAFE mechanical normalization (NO assumptions)
  // ------------------------------------------------------------

  const mech = input.mechanical_resolution;

  const roll =
    typeof mech?.roll === "number" ? mech.roll : null;

  const dc =
    typeof mech?.dc === "number" ? mech.dc : null;

  const outcome =
    mech?.outcome ?? "no_roll";

  // ------------------------------------------------------------
  // World Delta Derivation (MECHANICAL ONLY)
  // ------------------------------------------------------------

  const world_delta: WorldDelta = {
    discoveries: [],
    signals: [],
    losses: [],
  };

  // Only derive pressure/territory if a real roll occurred
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

  // ------------------------------------------------------------
  // Merge upstream hints (guarded, non-authoritative)
  // ------------------------------------------------------------

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
  // Canonical Resolution (schema-safe)
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
