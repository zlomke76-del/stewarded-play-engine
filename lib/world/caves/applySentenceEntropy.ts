// ------------------------------------------------------------
// applySentenceEntropy
// ------------------------------------------------------------
// Governs how cave sentences age, scar, mutate, or disappear.
// This file is AUTHORITATIVE for entropy math.
// ------------------------------------------------------------

import type { CaveSentence } from "./WindscarCave.sentences";

/* ------------------------------------------------------------
   Entropy Rules (Canonical)
------------------------------------------------------------ */

export const CaveEntropyRules = {
  // Base entropy added when a sentence is spoken
  baseSentenceEntropy: 0.08,

  // Above this, silence may occur instead of text
  silenceThreshold: 0.55,

  // Above this, impossible lines may surface
  impossibleThreshold: 0.92,

  // How much scar accumulates per reuse
  scarIncrement: 0.15,

  // After this many scars, mutation is forced
  maxScarsBeforeMutation: 3,
} as const;

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type SentenceEntropyState = {
  entropy: number;      // 0–1
  scars: number;
  lastUsedTurn?: number;
};

/* ------------------------------------------------------------
   Core Function
------------------------------------------------------------ */

export function applySentenceEntropy(
  sentence: CaveSentence,
  state: SentenceEntropyState,
  currentTurn: number,
  kind: "sentence" | "omen" | "impossible"
): SentenceEntropyState {
  let entropyDelta = 0;

  switch (kind) {
    case "sentence":
      entropyDelta = CaveEntropyRules.baseSentenceEntropy;
      break;

    case "omen":
      entropyDelta = CaveEntropyRules.baseSentenceEntropy * 1.5;
      break;

    case "impossible":
      entropyDelta = 1; // burns the system
      break;
  }

  const nextEntropy = Math.min(
    1,
    state.entropy + entropyDelta * sentence.entropyWeight
  );

  const nextScars =
    state.lastUsedTurn !== undefined
      ? state.scars + CaveEntropyRules.scarIncrement
      : state.scars;

  return {
    entropy: nextEntropy,
    scars: nextScars,
    lastUsedTurn: currentTurn,
  };
}

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

export function shouldBeSilent(
  entropy: number
): boolean {
  return entropy >= CaveEntropyRules.silenceThreshold;
}

export function shouldTriggerImpossible(
  entropy: number
): boolean {
  return entropy >= CaveEntropyRules.impossibleThreshold;
}

export function shouldMutate(
  scars: number
): boolean {
  return scars >= CaveEntropyRules.maxScarsBeforeMutation;
}
