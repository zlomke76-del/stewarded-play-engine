// ------------------------------------------------------------
// Cave Narration Emitter
// ------------------------------------------------------------
// Entropy-driven narration + hazard binding
// Forced exit + burial handling
// ------------------------------------------------------------

import type { CaveNode, CaveGraph } from "./WindscarCave";

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

export type CaveNarrationResult = {
  text: string | null;
  entropy: number;
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
  cave: CaveGraph,
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
    sentenceResult.sentence ? "sentence" : "silence",
    memory
  );

  const entropyAfter = entropyResult.entropyAfter;

  /* ----------------------------------------------------------
     Bind Entropy → Hazards
  ---------------------------------------------------------- */

  const hazardBinding = bindEntropyToHazards(
    node,
    entropyAfter
  );

  /* ----------------------------------------------------------
     Forced Exit / Burial Resolution
  ---------------------------------------------------------- */

  let forcedExit:
    | ReturnType<typeof resolveForcedExit>
    | undefined;

  if (hazardBinding.triggeredEvent) {
    forcedExit = resolveForcedExit(
      cave,                               // CaveGraph
      node.nodeId,                       // current location
      hazardBinding.triggeredEvent.type  // ✅ discriminator ONLY
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
