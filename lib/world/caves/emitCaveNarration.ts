// ------------------------------------------------------------
// Cave Narration Emitter
// ------------------------------------------------------------
// Entropy-driven narration + hazard + migration resolution
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
import {
  bindEntropyToHazards,
  type CaveHazardEvent,
} from "./bindEntropyToHazards";
import {
  resolveCaveMigration,
  type CaveMigrationResult,
} from "./resolveCaveMigration";

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

  hazardEvent: CaveHazardEvent;
  suppressOmens: boolean;

  migration: CaveMigrationResult | null;
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

  const hazardBinding =
    bindEntropyToHazards(
      node,
      entropyAfter.value
    );

  /* ----------------------------------------------------------
     Forced Migration Resolution
  ---------------------------------------------------------- */

  let migration: CaveMigrationResult | null =
    null;

  if (hazardBinding.triggeredEvent) {
    const migrationResult =
      resolveCaveMigration(
        cave,
        hazardBinding.triggeredEvent
      );

    if (migrationResult.type === "migrate") {
      migration = migrationResult;
    }
  }

  /* ----------------------------------------------------------
     Final Output
  ---------------------------------------------------------- */

  return {
    text: sentenceResult.sentence
      ? entropyResult.text
      : null,

    entropy: entropyAfter,

    updatedNode:
      hazardBinding.updatedNode,

    hazardEvent:
      hazardBinding.triggeredEvent,

    suppressOmens:
      hazardBinding.suppressOmens,

    migration,
  };
}
