// ------------------------------------------------------------
// resolveWithinEnvelope — Interpretive Authority
// Solace chooses meaning INSIDE the envelope
// Never modifies bounds, never exceeds them
// ------------------------------------------------------------

import { OutcomeEnvelope } from "@/lib/solace/outcomes/OutcomeEnvelope";

// Canonical resolution shape MUST already exist in your system.
// This function assumes SolaceResolution is authoritative and strict.

export type SolaceResolution = {
  opening_signal: string;
  situation_frame: string;
  pressures: string[];
  process: string;
  mechanical_resolution: {
    foodDelta?: number;
    staminaDelta?: number;
    fireDelta?: number;
    appliedRecoveryCap?: number;
  };
  aftermath: string;
};

type ResolutionContext = {
  narrativeIntent: string;
  currentState: {
    food: number;
    stamina: number;
    fire: number;
  };
};

export function resolveWithinEnvelope(input: {
  envelope: OutcomeEnvelope;
  context: ResolutionContext;
  chosenDeltas: {
    food?: number;
    stamina?: number;
    fire?: number;
  };
  narration: {
    opening: string;
    frame: string;
    process: string;
    aftermath: string;
  };
}): SolaceResolution {
  const { envelope, chosenDeltas } = input;

  // ------------------------------------------------------------
  // HARD BOUNDARY ENFORCEMENT
  // ------------------------------------------------------------

  enforceBounds("food", chosenDeltas.food, envelope.resourceDeltas.food);
  enforceBounds(
    "stamina",
    chosenDeltas.stamina,
    envelope.resourceDeltas.stamina
  );
  enforceBounds("fire", chosenDeltas.fire, envelope.resourceDeltas.fire);

  // ------------------------------------------------------------
  // Construct Canonical Resolution
  // ------------------------------------------------------------

  return {
    opening_signal: input.narration.opening,
    situation_frame: input.narration.frame,
    pressures: [envelope.riskProfile],
    process: input.narration.process,
    mechanical_resolution: {
      foodDelta: chosenDeltas.food,
      staminaDelta: chosenDeltas.stamina,
      fireDelta: chosenDeltas.fire,
      appliedRecoveryCap: envelope.recoveryCaps?.staminaMax,
    },
    aftermath: input.narration.aftermath,
  };
}

// ------------------------------------------------------------
// Enforcement — No Silent Drift Allowed
// ------------------------------------------------------------

function enforceBounds(
  key: string,
  value: number | undefined,
  range?: { min: number; max: number }
) {
  if (value === undefined) return;
  if (!range) {
    throw new Error(
      `Illegal ${key} delta (${value}). No delta allowed by envelope.`
    );
  }
  if (value < range.min || value > range.max) {
    throw new Error(
      `Illegal ${key} delta (${value}). Allowed range: ${range.min} to ${range.max}.`
    );
  }
}
