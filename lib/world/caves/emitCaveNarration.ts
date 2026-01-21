// ------------------------------------------------------------
// Cave Narration Emitter
// ------------------------------------------------------------
// Entropy-driven narration + hazard binding
// Forced exit / burial resolution
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
import { resolveForcedExit } from "./resolveForcedExit";

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
  forcedExit?: ReturnType<typeof resolveForcedExit>;
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
     Impossible-line latch
  ---------------------------------------------------------- */

  const usedImpossible =
    Object.keys(memory.scars).length > 0;

  /* ----------------------------------------------------------
     Sentence Selection
  ---------------------------------------------------------- */

  const sentenceResult: CaveSentenceResult =
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
    sentenceResult.sentence
      ? "sentence"
      : "silence",
    memory
  );

  const entropyAfter: CaveEntropyState = {
    value: entropyResult.entropyAfter,
  };

  /* ----------------------------------------------------------
     Bind Entropy → Hazards
  ---------------------------------------------------------- */

  const hazardBinding = bindEntropyToHazards(
    node,
    entropyAfter.value
  );

  /* ----------------------------------------------------------
     Forced Exit Resolution (FIXED CALL)
  ---------------------------------------------------------- */

  let forcedExit:
    | ReturnType<typeof resolveForcedExit>
    | undefined;

  if (hazardBinding.triggeredEvent) {
    forcedExit = resolveForcedExit(
      node,                             // ✅ arg 1
      hazardBinding.triggeredEvent,     // ✅ arg 2
      tribe                             // ✅ arg 3
    );
  }

  /* ----------------------------------------------------------
     Final Output
  ---------------------------------------------------------- */

  return {
    text: sentenceResult.sentence
      ? entropyResult.text
      : null,
    entropy: entropyAfter,
    updatedNode: hazardBinding.updatedNode,
    hazardEvent:
      hazardBinding.triggeredEvent,
    suppressOmens:
      hazardBinding.suppressOmens,
    forcedExit,
  };
}
