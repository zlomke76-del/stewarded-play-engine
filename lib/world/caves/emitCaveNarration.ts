// ------------------------------------------------------------
// Emit Cave Narration
// ------------------------------------------------------------
// Orchestrates:
// - Sentence selection
// - Entropy application
// - Impossible-line enforcement
// ------------------------------------------------------------

import { applySentenceEntropy } from "./applySentenceEntropy";
import {
  selectCaveSentence,
  TribeProfile,
} from "./selectCaveSentence";

import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type SentenceMemory = {
  usedSentenceIds: Set<string>;
  usedImpossibleIds: Set<string>;
};

export type CaveNarrationContext = {
  node: CaveNode;
  entropy: number;
  tribe: TribeProfile;
  memory: SentenceMemory;
};

/* ------------------------------------------------------------
   Main
------------------------------------------------------------ */

export function emitCaveNarration(ctx: CaveNarrationContext) {
  const { node, entropy, tribe, memory } = ctx;

  const entropyBefore = entropy;

  // 🔑 Convert Set → boolean for selector
  const usedImpossible =
    memory.usedImpossibleIds.size > 0;

  /* ----------------------------------------------------------
     Sentence selection
  ---------------------------------------------------------- */

  const result = selectCaveSentence(
    node.nodeId,
    entropyBefore,
    tribe,
    usedImpossible
  );

  /* ----------------------------------------------------------
     Entropy update
  ---------------------------------------------------------- */

  const entropyAfter = applySentenceEntropy(
    entropyBefore,
    result.sentence ? "sentence" : "silence",
    memory
  );

  /* ----------------------------------------------------------
     Memory update
  ---------------------------------------------------------- */

  if (result.sentence) {
    memory.usedSentenceIds.add(result.sentence.id);

    if (result.usedImpossible) {
      memory.usedImpossibleIds.add(result.sentence.id);
    }
  }

  return {
    sentence: result.sentence,
    entropyBefore,
    entropyAfter,
    memory,
  };
}
