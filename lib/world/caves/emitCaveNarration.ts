// ------------------------------------------------------------
// Cave Narration Emitter
// ------------------------------------------------------------
// Responsibilities:
// - Select cave sentence OR silence
// - Inject omen ladder (pre-collapse / pre-flood only)
// - Apply sentence entropy + scar logic
// - Respect tribe perception bias
// - NEVER emit omens after collapse/flood
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave";
import { getCaveOmen } from "./omenLadder";
import {
  applySentenceEntropy,
  SentenceMemory,
  TribeProfile,
  CaveEntropyState,
} from "./applySentenceEntropy";
import {
  selectCaveSentence,
  CaveSentenceResult,
} from "./selectCaveSentence";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveNarrationContext = {
  node: CaveNode;
  entropy: CaveEntropyState;
  memory: SentenceMemory;
  tribe: TribeProfile;
  turn: number;

  // Hard stop flags (canon-level)
  collapsed?: boolean;
  flooded?: boolean;
};

export type CaveNarrationResult = {
  text: string | null; // null = silence
  entropy: CaveEntropyState;
  usedOmen: boolean;
};

/* ------------------------------------------------------------
   Perception Bias
------------------------------------------------------------ */

function omenThresholdModifier(
  tribe: TribeProfile
): number {
  switch (tribe.role) {
    case "elder":
      return -15; // elders notice danger earlier
    case "hunter":
      return 0;
    case "scout":
      return -5;
    default:
      return 0;
  }
}

/* ------------------------------------------------------------
   Main Entry
------------------------------------------------------------ */

export function emitCaveNarration(
  ctx: CaveNarrationContext
): CaveNarrationResult {
  const {
    node,
    entropy,
    memory,
    tribe,
    collapsed,
    flooded,
  } = ctx;

  const entropyBefore = entropy;

  /* ----------------------------------------------------------
     1️⃣ OMEN CHECK (BEFORE SENTENCE)
     ---------------------------------------------------------- */

  // Omens are suppressed permanently after failure
  if (!collapsed && !flooded) {
    const omen = getCaveOmen(node);

    if (omen) {
      const perceptionShift =
        omenThresholdModifier(tribe);

      const perceived =
        node.hazards.collapseRisk +
          (node.hazards.floodRisk ?? 0) / 2 +
          perceptionShift >=
        40 + omen.level * 10;

      if (perceived) {
        const entropyAfter = applySentenceEntropy(
          entropyBefore,
          "omen",
          memory
        );

        return {
          text: omen.line,
          entropy: entropyAfter,
          usedOmen: true,
        };
      }
    }
  }

  /* ----------------------------------------------------------
     2️⃣ SENTENCE SELECTION
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
     3️⃣ ENTROPY + MEMORY UPDATE
     ---------------------------------------------------------- */

  const entropyAfter = applySentenceEntropy(
    entropyBefore,
    result.sentence ? "sentence" : "silence",
    memory
  );

  if (result.sentence) {
    memory.usedSentenceIds.add(result.sentence.id);

    if (result.usedImpossible) {
      memory.usedImpossible = true;
    }

    return {
      text: result.sentence.text,
      entropy: entropyAfter,
      usedOmen: false,
    };
  }

  /* ----------------------------------------------------------
     4️⃣ SILENCE (EXPORT WILL OMIT)
     ---------------------------------------------------------- */

  return {
    text: null,
    entropy: entropyAfter,
    usedOmen: false,
  };
}
