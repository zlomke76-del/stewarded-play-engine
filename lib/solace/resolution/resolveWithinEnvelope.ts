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
// Scene Synthesis (BOUNDED COGNITION)
// ------------------------------------------------------------
// Purpose:
// - Render the world perceptibly (no images available)
// - No advice, no optimization, no goals
// - Physical causality only
// ------------------------------------------------------------

function synthesizeProcessNarration(input: {
  subject: string;
  frame: string[];
  pressures: string[];
}): string[] {
  const lines: string[] = [];

  if (input.frame.length > 0) {
    lines.push(
      `${input.subject} moves through ${input.frame.join(
        ", "
      )}, forcing closer spacing and shorter steps.`
    );
  }

  if (input.pressures.length > 0) {
    lines.push(
      `The ground resists easy passage, narrowing paths and breaking stride.`
    );
  }

  lines.push(
    `Progress continues, but movement here costs more effort than before.`
  );

  return lines;
}

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

  const intentAtoms: NarrativeAtom[] = input.narration.frame
    .map(
      (text): NarrativeAtom =>
        ({
          text,
          role: "intent",
        } satisfies NarrativeAtom)
    )
    .filter((a) => a.text && a.text.trim().length > 0);

  const worldAtoms: NarrativeAtom[] = [
    {
      text: String(envelope.riskProfile),
      role: "world",
    } as NarrativeAtom,
  ];

  const consequenceAtoms: NarrativeAtom[] =
    input.narration.aftermath
      .map(
        (text): NarrativeAtom =>
          ({
            text,
            role: "consequence",
          } satisfies NarrativeAtom)
      )
      .filter((a) => a.text && a.text.trim().length > 0);

  // ----------------------------------------------------------
  // Phase 2: Scene Synthesis (THIS IS THE FIX)
  // ----------------------------------------------------------
  // Solace is allowed to THINK here:
  // - about space
  // - about bodies
  // - about resistance
  // She is NOT allowed to advise or plan.
  // ----------------------------------------------------------

  const process = synthesizeProcessNarration({
    subject: "The Ugh Tribe",
    frame: input.narration.frame,
    pressures: worldAtoms.map((a) => a.text),
  });

  // ----------------------------------------------------------
  // Construct Canonical Resolution
  // ----------------------------------------------------------

  return {
    opening_signal: input.narration.opening,

    situation_frame: intentAtoms.map((a) => a.text),
    pressures: worldAtoms.map((a) => a.text),
    process,

    mechanical_resolution: {
      foodDelta: chosenDeltas.food,
      staminaDelta: chosenDeltas.stamina,
      fireDelta: chosenDeltas.fire,
      appliedRecoveryCap:
        envelope.recoveryCaps?.staminaMax,
    },

    aftermath: consequenceAtoms.map((a) => a.text),
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
