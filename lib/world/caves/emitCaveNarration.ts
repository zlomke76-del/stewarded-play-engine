// ------------------------------------------------------------
// Cave Narration Emitter
// ------------------------------------------------------------
// Responsibilities:
// - Select cave sentence (or silence)
// - Apply entropy + perception bias
// - Emit narration without leaking canon certainty
// ------------------------------------------------------------

import { selectCaveSentence } from "./selectCaveSentence";
import { applySentenceEntropy } from "./applySentenceEntropy";
import type { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type TribeRole = "general" | "hunters" | "elders";

export type TribeProfile = {
  role: TribeRole;
};

export type SentenceMemory = {
  usedSentenceIds: Set<string>;
  usedImpossibleIds: Set<string>;
  scars: Record<string, number>;
};

export type CaveEntropyState = {
  value: number;
};

/* ------------------------------------------------------------
   Perception & Entropy Sensitivity
------------------------------------------------------------ */

// Negative = notices danger earlier
function perceptionBias(role: TribeRole): number {
  switch (role) {
    case "elders":
      return -15;
    case "hunters":
      return 0;
    case "general":
    default:
      return 5;
  }
}

// Higher = more reactive to entropy changes
function entropySensitivity(role: TribeRole): number {
  switch (role) {
    case "elders":
      return 1.4;
    case "hunters":
      return 1.0;
    case "general":
    default:
      return 0.8;
  }
}

/* ------------------------------------------------------------
   Emit Narration
------------------------------------------------------------ */

export function emitCaveNarration(ctx: {
  node: CaveNode;
  entropy: CaveEntropyState;
  tribe: TribeProfile;
  memory: SentenceMemory;
}) {
  const { node, entropy, tribe, memory } = ctx;

  // 🔑 Complete the TribeProfile for sentence selection
  const sentenceTribeProfile = {
    role: tribe.role,
    entropySensitivity: entropySensitivity(tribe.role),
  };

  const entropyBefore =
    entropy.value + perceptionBias(tribe.role);

  const usedImpossible =
    memory.usedImpossibleIds.size > 0;

  /* ----------------------------------------------------------
     Sentence selection
  ---------------------------------------------------------- */

  const result = selectCaveSentence(
    node.nodeId,
    entropyBefore,
    sentenceTribeProfile,
    usedImpossible
  );

  /* ----------------------------------------------------------
     Entropy progression
  ---------------------------------------------------------- */

  const entropyAfter = applySentenceEntropy(
    entropy,
    result.sentence ? "sentence" : "silence",
    memory
  );

  /* ----------------------------------------------------------
     Memory mutation
  ---------------------------------------------------------- */

  if (result.sentence) {
    memory.usedSentenceIds.add(result.sentence.id);

    if (result.usedImpossible) {
      memory.usedImpossibleIds.add(result.sentence.id);
    }
  }

  return {
    text: result.sentence?.text ?? null,
    entropy: entropyAfter,
  };
}
