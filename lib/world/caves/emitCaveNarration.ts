// ------------------------------------------------------------
// Cave Narration Emitter (AUTHORITATIVE)
// ------------------------------------------------------------
// Entropy-driven narration + hazard binding
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave";

import {
  applySentenceEntropy,
  type SentenceMemory,
  type TribeProfile,
} from "./applySentenceEntropy";

import {
  selectCaveSentence,
  type CaveSentenceResult,
} from "./selectCaveSentence";

import { bindEntropyToHazards } from "./bindEntropyToHazards";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveEntropyState = {
  value: number;
};

export type CaveNarrationResult = {
  text: string | null;
  entropy: CaveEntropyState;
  updatedNode: CaveNode;
  hazardEvent: ReturnType<
    typeof bindEntropyToHazards
  >["triggeredEvent"];
  suppressOmens: boolean;
};

/* ------------------------------------------------------------
   Core Emitter
------------------------------------------------------------ */

export function emitCaveNarration(
  node: CaveNode,
  entropy: number, // 🔑 entropy is ALWAYS a number here
  memory: SentenceMemory,
  tribe: TribeProfile
): CaveNarrationResult {
  const entropyBefore: number = entropy;

  /* ----------------------------------------------------------
     Impossible-line latch
     (scar-derived ONLY, never reset)
  ---------------------------------------------------------- */

  const usedImpossible =
    Object.keys(memory.scars).length > 0;

  /* ----------------------------------------------------------
     Sentence Selection
  ---------------------------------------------------------- */

  const result: CaveSentenceResult =
    selectCaveSentence(
      node.nodeId,
      entropyBefore,
      tribe,
      usedImpossible
    );

  /* ----------------------------------------------------------
     Apply Sentence Entropy
  ---------------------------------------------------------- */

  const entropyResult = applySentenceEntropy(
    entropyBefore,
    result.sentence ? "sentence" : "silence",
    memory
  );

  const entropyAfterValue: number =
    entropyResult.entropyAfter;

  const entropyAfter: CaveEntropyState = {
    value: entropyAfterValue,
  };

  /* ----------------------------------------------------------
     Bind Entropy → Hazards
  ---------------------------------------------------------- */

  const hazardBinding = bindEntropyToHazards(
    node,
    entropyAfterValue
  );

  /* ----------------------------------------------------------
     Final Output
  ---------------------------------------------------------- */

  return {
    text: result.sentence
      ? entropyResult.text
      : null,

    entropy: entropyAfter,

    updatedNode: hazardBinding.updatedNode,

    hazardEvent:
      hazardBinding.triggeredEvent,

    suppressOmens:
      hazardBinding.suppressOmens,
  };
}
