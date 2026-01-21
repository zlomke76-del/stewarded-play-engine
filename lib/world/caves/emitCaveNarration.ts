// ------------------------------------------------------------
// Cave Narration Emitter
// ------------------------------------------------------------
// Entropy-driven narration + hazard binding
// Forced exit + burial handling (graph-aware)
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

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export type CaveEntropyState = {
  value: number;
};

export type CaveNarrationResult = {
  text: string | null;
  entropy: CaveEntropyState;

  // Cave mutation
  updatedNode: CaveNode;

  // Hazard resolution
  hazardEvent: ReturnType<
    typeof bindEntropyToHazards
  >["triggeredEvent"];

  suppressOmens: boolean;

  // Forced exit / terminal
  forcedExit?: ReturnType<typeof resolveForcedExit>;
};

// ------------------------------------------------------------
// Core Emitter (AUTHORITATIVE)
// ------------------------------------------------------------

export function emitCaveNarration(
  cave: CaveGraph,
  node: CaveNode,
  entropy: number,
  memory: SentenceMemory,
  tribe: TribeProfile
): CaveNarrationResult {
  const entropyBefore = entropy;

  /* ----------------------------------------------------------
     Impossible-line latch
     (scar-based, one-way)
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
     Sentence Entropy Application
  ---------------------------------------------------------- */

  const entropyResult = applySentenceEntropy(
    entropyBefore,
    sentenceResult.sentence ? "sentence" : "silence",
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
     Forced Exit / Burial Resolution (GRAPH-AWARE)
  ---------------------------------------------------------- */

  let forcedExit:
    | ReturnType<typeof resolveForcedExit>
    | undefined;

  if (hazardBinding.triggeredEvent) {
    forcedExit = resolveForcedExit(
      cave,                          // ✅ CaveGraph
      node.nodeId,                   // ✅ current location
      hazardBinding.triggeredEvent,  // ✅ collapse / flood
      tribe                          // ✅ perception bias
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

    hazardEvent: hazardBinding.triggeredEvent,

    suppressOmens: hazardBinding.suppressOmens,

    forcedExit,
  };
}
