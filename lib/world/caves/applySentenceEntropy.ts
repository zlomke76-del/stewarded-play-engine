// ------------------------------------------------------------
// applySentenceEntropy
// ------------------------------------------------------------
// Governs narrative decay inside caves.
// - Sentences age out
// - Silence emerges
// - Omens surface
// - Impossible lines unlock once (globally)
// ------------------------------------------------------------

/* ------------------------------------------------------------
   Rules (Authoritative)
------------------------------------------------------------ */

export const CaveEntropyRules = {
  // When silence begins to appear
  silenceThreshold: 0.55,

  // When impossible lines may appear
  impossibleThreshold: 0.85,

  // Base entropy added per sentence exposure
  sentenceEntropyIncrement: 0.08,

  // Additional entropy for omens
  omenEntropyIncrement: 0.14,

  // Scar tissue growth per reuse
  scarIncrement: 1,

  // After this many scars, text mutates
  maxScarsBeforeMutation: 3,

  // Absolute entropy ceiling
  maxEntropy: 1.0,
};

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type EntropyEventType =
  | "sentence"
  | "omen"
  | "silence"
  | "impossible";

export type SentenceEntropyState = {
  entropy: number;
  scars: number;
  mutated: boolean;
};

/* ------------------------------------------------------------
   Core Entropy Application
------------------------------------------------------------ */

export function applySentenceEntropy(
  state: SentenceEntropyState,
  event: EntropyEventType
): SentenceEntropyState {
  let entropyDelta = 0;

  switch (event) {
    case "sentence":
      entropyDelta =
        CaveEntropyRules.sentenceEntropyIncrement;
      break;

    case "omen":
      entropyDelta =
        CaveEntropyRules.omenEntropyIncrement;
      break;

    case "impossible":
      // Impossible lines permanently scar the cave
      entropyDelta = 0.25;
      break;

    case "silence":
      // Silence accelerates decay subtly
      entropyDelta = 0.04;
      break;
  }

  const nextEntropy = Math.min(
    CaveEntropyRules.maxEntropy,
    state.entropy + entropyDelta
  );

  const nextScars =
    event === "sentence" || event === "omen"
      ? state.scars + CaveEntropyRules.scarIncrement
      : state.scars;

  const mutated =
    nextScars >=
    CaveEntropyRules.maxScarsBeforeMutation;

  return {
    entropy: nextEntropy,
    scars: nextScars,
    mutated,
  };
}

/* ------------------------------------------------------------
   Entropy Queries
------------------------------------------------------------ */

export function shouldBeSilent(
  entropy: number
): boolean {
  return entropy >= CaveEntropyRules.silenceThreshold;
}

export function shouldTriggerImpossible(
  entropy: number
): boolean {
  return (
    entropy >=
    CaveEntropyRules.impossibleThreshold
  );
}
