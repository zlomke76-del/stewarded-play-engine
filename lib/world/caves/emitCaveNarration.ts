// ------------------------------------------------------------
// Cave Narration Emitter
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
  entropy: number,
  memory: SentenceMemory,
  tribe: TribeProfile
): CaveNarrationResult {
  const entropyBefore = entropy;

  /* ----------------------------------------------------------
     Impossible-line latch (scar-derived ONLY)
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

  const entropyAfter: CaveEntropyState = {
    value: entropyResult.entropyAfter,
  };

  /* ----------------------------------------------------------
     Bind Entropy → Hazards
  ---------------------------------------------------------- */

  const hazardBinding =
    bindEntropyToHazards(
      node,
      entropyAfter.value
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
