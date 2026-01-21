// ------------------------------------------------------------
// applySentenceEntropy
// ------------------------------------------------------------
// Advances cave sentence entropy over time.
// Called AFTER a narration event resolves.
// ------------------------------------------------------------

import { CaveEntropyRules } from "./WindscarCave.sentences";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type EntropyEvent =
  | {
      type: "sentence";
      sentenceId: string;
    }
  | {
      type: "silence";
    }
  | {
      type: "omen";
    }
  | {
      type: "impossible";
    };

export type TribeProfile = {
  role: "hunters" | "elders" | "mixed";
  entropySensitivity: number; // 0.0 – 1.0
};

export type SentenceMemory = {
  scars: Record<string, number>;
  impossibleUsed: boolean;
};

export type CaveEntropyState = {
  value: number; // 0.0 – 1.0
  familiarity: number; // 0.0 – 1.0 (how well-known this cave is)
};

export type UpdatedEntropyState = {
  entropy: CaveEntropyState;
  memory: SentenceMemory;
};

/* ------------------------------------------------------------
   Core Function
------------------------------------------------------------ */

export function applySentenceEntropy(
  current: CaveEntropyState,
  event: EntropyEvent,
  tribe: TribeProfile,
  memory: SentenceMemory
): UpdatedEntropyState {
  let entropyDelta = 0;

  /* ----------------------------------------------------------
     Base entropy gain
  ---------------------------------------------------------- */

  switch (event.type) {
    case "sentence":
      entropyDelta =
        CaveEntropyRules.baseSentenceEntropy;
      break;

    case "omen":
      entropyDelta =
        CaveEntropyRules.omenEntropy;
      break;

    case "silence":
      entropyDelta =
        CaveEntropyRules.silenceEntropy;
      break;

    case "impossible":
      entropyDelta =
        CaveEntropyRules.impossibleEntropy;
      break;
  }

  /* ----------------------------------------------------------
     Tribe sensitivity
  ---------------------------------------------------------- */

  entropyDelta *= tribe.entropySensitivity;

  if (tribe.role === "elders") {
    entropyDelta *= 1.25;
  }

  /* ----------------------------------------------------------
     Familiarity dampening
     (known caves stabilize… until they don’t)
  ---------------------------------------------------------- */

  const familiarityFactor =
    1 - Math.min(current.familiarity, 0.8);

  entropyDelta *= familiarityFactor;

  /* ----------------------------------------------------------
     Silence accelerates decay
  ---------------------------------------------------------- */

  if (event.type === "silence") {
    current.familiarity += 0.02;
  }

  /* ----------------------------------------------------------
     Sentence scar tissue
  ---------------------------------------------------------- */

  if (event.type === "sentence") {
    memory.scars[event.sentenceId] =
      (memory.scars[event.sentenceId] ?? 0) + 1;

    if (
      memory.scars[event.sentenceId] >=
      CaveEntropyRules.maxScarsBeforeMutation
    ) {
      entropyDelta +=
        CaveEntropyRules.scarEntropyBoost;
    }
  }

  /* ----------------------------------------------------------
     Impossible line destabilizes everything
  ---------------------------------------------------------- */

  if (event.type === "impossible") {
    memory.impossibleUsed = true;
    current.familiarity = Math.max(
      current.familiarity - 0.2,
      0
    );
  }

  /* ----------------------------------------------------------
     Clamp + advance
  ---------------------------------------------------------- */

  const nextEntropy = Math.min(
    1,
    Math.max(0, current.value + entropyDelta)
  );

  const nextFamiliarity = Math.min(
    1,
    current.familiarity +
      CaveEntropyRules.familiarityGain
  );

  return {
    entropy: {
      value: nextEntropy,
      familiarity: nextFamiliarity,
    },
    memory,
  };
}
