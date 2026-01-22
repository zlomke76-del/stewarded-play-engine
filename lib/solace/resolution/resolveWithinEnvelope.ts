// ------------------------------------------------------------
// resolveWithinEnvelope — Interpretive Authority
// Phase 1: Preserve authorship internally, flatten at boundary
// ------------------------------------------------------------

import { OutcomeEnvelope } from "@/lib/solace/outcomes/OutcomeEnvelope";

// ------------------------------------------------------------
// Narrative Atom (INTERNAL ONLY — Phase 1)
// ------------------------------------------------------------

type NarrativeAtom = {
  text: string;
  role: "intent" | "world" | "consequence";
};

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
  // HARD BOUNDARY ENFORCEMENT (UNCHANGED)
  // ------------------------------------------------------------

  enforceBounds("food", chosenDeltas.food, envelope.resourceDeltas.food);
  enforceBounds(
    "stamina",
    chosenDeltas.stamina,
    envelope.resourceDeltas.stamina
  );
  enforceBounds("fire", chosenDeltas.fire, envelope.resourceDeltas.fire);

  // ------------------------------------------------------------
  // Phase 1: Construct Narrative Atoms (NO INFERENCE)
  // ------------------------------------------------------------

  const intentAtoms: NarrativeAtom[] = [
    {
      text: input.narration.opening,
      role: "intent",
    },
    {
      text: input.narration.frame,
      role: "intent",
    },
    {
      text: input.narration.process,
      role: "intent",
    },
  ].filter(a => a.text && a.text.trim().length > 0);

  const worldAtoms: NarrativeAtom[] = [
    {
      text: envelope.riskProfile,
      role: "world",
    },
  ].filter(a => a.text && a.text.trim().length > 0);

  const consequenceAtoms: NarrativeAtom[] = [
    {
      text: input.narration.aftermath,
      role: "consequence",
    },
  ].filter(a => a.text && a.text.trim().length > 0);

  // ------------------------------------------------------------
  // Boundary Collapse (Phase 1)
  // IMPORTANT: We flatten ONLY here, preserving ordering
  // ------------------------------------------------------------

  const situation_frame = intentAtoms
    .filter(a => a.role === "intent")
    .map(a => a.text)
    .join(" ");

  const process = intentAtoms
    .filter(a => a.role === "intent")
    .map(a => a.text)
    .join(" ");

  const pressures = worldAtoms.map(a => a.text);

  const aftermath = consequenceAtoms
    .map(a => a.text)
    .join(" ");

  // ------------------------------------------------------------
  // Construct Canonical Resolution (UNCHANGED SHAPE)
  // ------------------------------------------------------------

  return {
    opening_signal: input.narration.opening,
    situation_frame,
    pressures,
    process,
    mechanical_resolution: {
      foodDelta: chosenDeltas.food,
      staminaDelta: chosenDeltas.stamina,
      fireDelta: chosenDeltas.fire,
      appliedRecoveryCap: envelope.recoveryCaps?.staminaMax,
    },
    aftermath,
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
