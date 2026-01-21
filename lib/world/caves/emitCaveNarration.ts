// ------------------------------------------------------------
// Cave Narration Emitter (AUTHORITATIVE)
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

export type CaveNarrationResult =
  | {
      outcome: "continue";
      text: string | null;
      entropy: CaveEntropyState;
      updatedNode: CaveNode;
      hazardEvent: ReturnType<
        typeof bindEntropyToHazards
      >["triggeredEvent"];
      suppressOmens: boolean;
    }
  | {
      outcome: "buried";
      description: string;
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

  const entropyAfterValue =
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
     Forced Exit / Burial Resolution
  ---------------------------------------------------------- */

  if (hazardBinding.triggeredEvent) {
    const forcedExit = resolveForcedExit({
      node,
      hazardEvent:
        hazardBinding.triggeredEvent,
    });

    if (forcedExit?.outcome === "buried") {
      return {
        outcome: "buried",
        description:
          forcedExit.description,
      };
    }

    // partial collapse / flood → auto-ejection
    if (forcedExit?.outcome === "ejected") {
      return {
        outcome: "continue",
        text: forcedExit.description,
        entropy: entropyAfter,
        updatedNode:
          hazardBinding.updatedNode,
        hazardEvent:
          hazardBinding.triggeredEvent,
        suppressOmens: true,
      };
    }
  }

  /* ----------------------------------------------------------
     Normal Continuation
  ---------------------------------------------------------- */

  return {
    outcome: "continue",
    text: sentenceResult.sentence
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
