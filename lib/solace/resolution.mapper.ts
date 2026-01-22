// ------------------------------------------------------------
// Solace Resolution Mapper
// ------------------------------------------------------------
// Legacy / internal payload → canonical SolaceResolution
//
// Purpose:
// - Normalize resolution outputs
// - Enforce strict schema compliance
// - No inference, no advice, no mutation
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

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
}): SolaceResolution {
  return {
    opening_signal: input.opening_signal,

    situation_frame: input.situation_frame.slice(0, 3),

    pressures: input.pressures.slice(0, 4),

    process: input.process.slice(0, 4),

    mechanical_resolution: {
      roll: input.mechanical_resolution.roll,
      dc: input.mechanical_resolution.dc,
      outcome: input.mechanical_resolution.outcome,
    },

    aftermath: input.aftermath.slice(0, 4),
  };
}
