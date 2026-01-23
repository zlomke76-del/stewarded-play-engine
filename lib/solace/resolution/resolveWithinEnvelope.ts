// ------------------------------------------------------------
// resolveWithinEnvelope — Interpretive Authority
// Phase 1: Preserve authorship internally, flattening forbidden
// ------------------------------------------------------------

import { OutcomeEnvelope } from "@/lib/solace/outcomes/OutcomeEnvelope";

// ------------------------------------------------------------
// Narrative Atom (INTERNAL ONLY — Phase 1)
// ------------------------------------------------------------

type NarrativeAtom = {
  text: string;
  role: "intent" | "world" | "consequence";
};

// ------------------------------------------------------------
// Canonical Resolution Shape (AUTHORITATIVE)
// ------------------------------------------------------------

export type SolaceResolution = {
  opening_signal: string;

  situation_frame: string[];
  pressures: string[];
  process: string[];

  mechanical_resolution: {
    foodDelta?: number;
    staminaDelta?: number;
    fireDelta?: number;
    appliedRecoveryCap?: number;
  };

  aftermath: string[];
};

type ResolutionContext = {
  narrativeIntent: string;
  currentState: {
    food: number;
    stamina: number;
    fire: number;
  };
};

// ------------------------------------------------------------
// Interpretive Authority
// ------------------------------------------------------------

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
    frame: string[];
    process: string[];
    aftermath: string[];
  };
}): SolaceResolution {
  const { envelope, chosenDeltas } = input;

  // ----------------------------------------------------------
  // HARD BOUNDARY ENFORCEMENT
  // ----------------------------------------------------------

  enforceBounds("food", chosenDeltas.food, envelope.resourceDeltas.food);
  enforceBounds(
    "stamina",
    chosenDeltas.stamina,
    envelope.resourceDeltas.stamina
  );
  enforceBounds("fire", chosenDeltas.fire, envelope.resourceDeltas.fire);

  // ----------------------------------------------------------
  // Phase 1: Construct Narrative Atoms (NO INFERENCE)
  // ----------------------------------------------------------

  const intentAtoms: NarrativeAtom[] = [
    ...input.narration.frame.map(
      (text): NarrativeAtom => ({
        text,
        role: "intent",
      })
    ),
    ...input.narration.process.map(
      (text): NarrativeAtom => ({
        text,
        role: "intent",
      })
    ),
  ].filter((a) => a.text && a.text.trim().length > 0);

  const worldAtoms: NarrativeAtom[] = [
    {
      text: String(envelope.riskProfile),
      role: "world",
    },
  ].filter((a) => a.text && a.text.trim().length > 0);

  const consequenceAtoms: NarrativeAtom[] =
    input.narration.aftermath
      .map(
        (text): NarrativeAtom => ({
          text,
          role: "consequence",
        })
      )
      .filter(
        (a) => a.text && a.text.trim().length > 0
      );

  // ----------------------------------------------------------
  // Boundary Collapse (ARRAY SAFE)
  // ----------------------------------------------------------

  const situation_frame = intentAtoms.map(
    (a) => a.text
  );
  const process = intentAtoms.map(
    (a) => a.text
  );
  const pressures = worldAtoms.map(
    (a) => a.text
  );
  const aftermath = consequenceAtoms.map(
    (a) => a.text
  );

  // ----------------------------------------------------------
  // Construct Canonical Resolution
  // ----------------------------------------------------------

  return {
    opening_signal: input.narration.opening,

    situation_frame,
    pressures,
    process,

    mechanical_resolution: {
      foodDelta: chosenDeltas.food,
      staminaDelta: chosenDeltas.stamina,
      fireDelta: chosenDeltas.fire,
      appliedRecoveryCap:
        envelope.recoveryCaps?.staminaMax,
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
