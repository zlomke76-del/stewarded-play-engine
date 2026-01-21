// ------------------------------------------------------------
// Cave Narration Emitter
// ------------------------------------------------------------
// Emits narrative text based on entropy, tribe perception,
// and cave sentence availability.
// Silence is intentional and NOT exported.
// ------------------------------------------------------------

import {
  applySentenceEntropy,
  SentenceMemory,
  TribeProfile,
} from "./applySentenceEntropy";

import {
  selectCaveSentence,
  CaveSentenceResult,
} from "./selectCaveSentence";

import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type EmitCaveNarrationContext = {
  node: CaveNode;
  entropy: number;
  tribe: TribeProfile;
  memory: SentenceMemory;
  usedImpossible: Set<string>;
};

/* ------------------------------------------------------------
   Emitter
------------------------------------------------------------ */

export function emitCaveNarration(
  ctx: EmitCaveNarrationContext
): {
  text: string | null;
  entropyAfter: number;
} {
  const {
    node,
    entropy,
    tribe,
    memory,
    usedImpossible,
  } = ctx;

  const entropyBefore = entropy;

  /* ----------------------------------------------------------
     Sentence selection
  ---------------------------------------------------------- */

  const result: CaveSentenceResult =
    selectCaveSentence(
      node.nodeId,
      entropyBefore,
      tribe,
      usedImpossible
    );

  /* ----------------------------------------------------------
     Silence path (intentional)
  ---------------------------------------------------------- */

  if (!result.sentence) {
    const entropyAfter = applySentenceEntropy(
      entropyBefore,
      "silence",
      memory
    );

    return {
      text: null, // silence is NOT exported
      entropyAfter,
    };
  }

  /* ----------------------------------------------------------
     Impossible sentence (one-time)
  ---------------------------------------------------------- */

  if (result.reason === "impossible-consumed") {
    usedImpossible.add(result.sentence.id);
  }

  /* ----------------------------------------------------------
     Apply entropy + scarring
  ---------------------------------------------------------- */

  const { text, entropyAfter } =
    applySentenceEntropy(
      entropyBefore,
      "sentence",
      memory,
      result.sentence
    );

  return {
    text,
    entropyAfter,
  };
}
