// ------------------------------------------------------------
// Cave Narration Emitter
// ------------------------------------------------------------
// Selects cave sentences, applies entropy,
// binds hazards, and emits canonical narration
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave";
import {
  applySentenceEntropy,
  type SentenceMemory,
  type CaveEntropyState,
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
  entropy: CaveEntropyState,
  memory: SentenceMemory,
  tribe: TribeProfile
): CaveNarrationResult {
  const entropyBefore = entropy.value;

  /* ----------------------------------------------------------
     Sentence Selection
  ---------------------------------------------------------- */

  const usedImpossible =
    memory.usedImpossible === true;

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
     Memory Updates (One-way)
  ---------------------------------------------------------- */

  if (result.sentence) {
    memory.usedSentenceIds.add(
      result.sentence.id
    );

    if (result.usedImpossible) {
      memory.usedImpossible = true;
    }
  }

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
