// ------------------------------------------------------------
// emitCaveNarration
// ------------------------------------------------------------
// Central cave narration engine
// Binds entropy → hazards → silence / events
// ------------------------------------------------------------

import type { CaveNode } from "./WindscarCave";
import { bindEntropyToHazards } from "./bindEntropyToHazards";
import { selectCaveSentence } from "./selectCaveSentence";
import { applySentenceEntropy } from "./applySentenceEntropy";

/* ------------------------------------------------------------
   Types (LOCAL, AUTHORITATIVE)
------------------------------------------------------------ */

export type TribeProfile = {
  role: "general" | "hunters" | "elders";
  entropySensitivity: number; // elders > hunters
};

export type CaveEntropyState = {
  value: number;
};

export type SentenceMemory = {
  scars: Record<string, number>;
  usedSentenceIds: Set<string>;
  usedImpossible: boolean;
};

/* ------------------------------------------------------------
   Result
------------------------------------------------------------ */

export type CaveNarrationResult = {
  text: string | null; // null = silence
  entropy: CaveEntropyState;
  updatedNode: CaveNode;
  hazardEvent?: {
    type: "collapse" | "flood";
    description: string;
  };
};

/* ------------------------------------------------------------
   Core Engine
------------------------------------------------------------ */

export function emitCaveNarration(params: {
  node: CaveNode;
  entropy: CaveEntropyState;
  memory: SentenceMemory;
  tribe: TribeProfile;
}): CaveNarrationResult {
  const { node, entropy, memory, tribe } = params;

  const entropyBefore = entropy.value;

  /* ----------------------------------------------------------
     Sentence selection (pre-hazard)
  ---------------------------------------------------------- */

  const sentenceResult = selectCaveSentence(
    node.nodeId,
    entropyBefore,
    tribe,
    memory.usedImpossible
  );

  /* ----------------------------------------------------------
     Entropy update
  ---------------------------------------------------------- */

  const entropyAfterValue = applySentenceEntropy(
    entropyBefore,
    sentenceResult.sentence ? "sentence" : "silence",
    memory
  );

  const entropyAfter: CaveEntropyState = {
    value: entropyAfterValue,
  };

  /* ----------------------------------------------------------
     Hazard binding (🔥 THIS IS THE KEY STEP)
  ---------------------------------------------------------- */

  const hazardBinding = bindEntropyToHazards(
    node,
    entropyAfterValue
  );

  /* ----------------------------------------------------------
     Silence rules
  ---------------------------------------------------------- */

  // Suppress narration if:
  // - hazard triggered
  // - hazard binding demands silence
  // - sentence was empty
  const shouldSilence =
    hazardBinding.suppressOmens ||
    !sentenceResult.sentence;

  /* ----------------------------------------------------------
     Memory updates
  ---------------------------------------------------------- */

  if (sentenceResult.sentence) {
    memory.usedSentenceIds.add(
      sentenceResult.sentence.id
    );

    if (sentenceResult.usedImpossible) {
      memory.usedImpossible = true;
    }
  }

  /* ----------------------------------------------------------
     Final Output
  ---------------------------------------------------------- */

  return {
    text: shouldSilence
      ? null
      : sentenceResult.sentence!.text,
    entropy: entropyAfter,
    updatedNode: hazardBinding.updatedNode,
    hazardEvent: hazardBinding.triggeredEvent
      ? {
          type: hazardBinding.triggeredEvent.type,
          description:
            hazardBinding.triggeredEvent.description,
        }
      : undefined,
  };
}
