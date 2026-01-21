// ------------------------------------------------------------
// Emit Cave Narration
// ------------------------------------------------------------
// Orchestrates:
// - Sentence selection
// - Entropy application
// - Impossible-line enforcement
// ------------------------------------------------------------

import {
  applySentenceEntropy,
  SentenceMemory,
} from "./applySentenceEntropy";

import {
  selectCaveSentence,
  TribeProfile,
} from "./selectCaveSentence";

import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

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

  // 🔒 One-time impossible latch
  const usedImpossible = Boolean(
    (memory as any).impossibleUsed
  );

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
     (NO sentence ID tracking — scars only)
  ---------------------------------------------------------- */

  if (result.usedImpossible) {
    // 🔒 Irreversible global latch
    (memory as any).impossibleUsed = true;
  }

  return {
    sentence: result.sentence,
    entropyBefore,
    entropyAfter,
    memory,
  };
}
