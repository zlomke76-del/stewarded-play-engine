// ------------------------------------------------------------
// selectCaveSentence
// ------------------------------------------------------------
// Chooses a cave narration line based on:
// - Node
// - Entropy (0.0–1.0)
// - Tribe perception bias
// - Scar tissue mutation
// - Wrong silence
// - One-time impossible line
// ------------------------------------------------------------

import {
  WindscarSentences,
  CollapseOmens,
  FloodOmens,
  WrongSilenceLines,
  ImpossibleLine,
  CaveEntropyRules,
  CaveSentence,
  CaveSense,
} from "./WindscarCave.sentences";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type TribeProfile = {
  role: "hunters" | "elders" | "mixed";
  entropySensitivity: number; // 0.0 – 1.0
};

export type SentenceMemory = {
  scars: Record<string, number>; // sentenceId → count
  impossibleUsed: boolean;
};

export type CaveNarrationResult =
  | {
      type: "sentence";
      text: string;
      sentenceId: string;
      sense: CaveSense;
    }
  | {
      type: "omen";
      text: string;
    }
  | {
      type: "silence";
    }
  | {
      type: "impossible";
      text: string;
    };

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

function weightedRandom<T>(
  items: T[],
  weight: (item: T) => number
): T | null {
  const total = items.reduce(
    (sum, i) => sum + Math.max(weight(i), 0),
    0
  );
  if (total <= 0) return null;

  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(weight(item), 0);
    if (roll <= 0) return item;
  }
  return null;
}

function mutateSentence(text: string): string {
  return text
    .replace("the", "that")
    .replace("here", "below")
    .replace("air", "space")
    .replace(".", "—again.");
}

/* ------------------------------------------------------------
   Core Function
------------------------------------------------------------ */

export function selectCaveSentence(
  nodeId: string,
  entropy: number,
  tribe: TribeProfile,
  memory: SentenceMemory
): CaveNarrationResult {
  const pool = WindscarSentences[nodeId] ?? [];

  const effectiveEntropy = Math.min(
    1,
    entropy * tribe.entropySensitivity
  );

  /* ----------------------------------------------------------
     Impossible Line (Global, One-Time)
  ---------------------------------------------------------- */

  if (
    effectiveEntropy >= CaveEntropyRules.impossibleThreshold &&
    !memory.impossibleUsed
  ) {
    memory.impossibleUsed = true;
    return {
      type: "impossible",
      text: ImpossibleLine.text,
    };
  }

  /* ----------------------------------------------------------
     Wrong Silence
  ---------------------------------------------------------- */

  if (effectiveEntropy >= CaveEntropyRules.silenceThreshold) {
    if (Math.random() < 0.35) {
      return { type: "silence" };
    }
  }

  /* ----------------------------------------------------------
     Perception Bias
  ---------------------------------------------------------- */

  const preferredSenses: CaveSense[] =
    tribe.role === "hunters"
      ? ["sound", "movement"]
      : tribe.role === "elders"
      ? ["air", "memory"]
      : ["sound", "air", "movement", "memory"];

  /* ----------------------------------------------------------
     Sentence Selection
  ---------------------------------------------------------- */

  const candidate = weightedRandom(pool, (s) => {
    const scars = memory.scars[s.id] ?? 0;

    if (scars >= CaveEntropyRules.maxScarsBeforeMutation) {
      return 0;
    }

    const senseBonus = preferredSenses.includes(s.sense)
      ? 1.5
      : 1;

    const entropyPenalty =
      effectiveEntropy < s.entropyCost ? 0.2 : 1;

    return senseBonus * entropyPenalty;
  });

  if (!candidate) {
    return { type: "silence" };
  }

  /* ----------------------------------------------------------
     Scar Tissue
  ---------------------------------------------------------- */

  const scars = memory.scars[candidate.id] ?? 0;
  memory.scars[candidate.id] = scars + 1;

  if (
    scars >= CaveEntropyRules.scarIncrement
  ) {
    return {
      type: "sentence",
      text: mutateSentence(candidate.text),
      sentenceId: candidate.id,
      sense: candidate.sense,
    };
  }

  return {
    type: "sentence",
    text: candidate.text,
    sentenceId: candidate.id,
    sense: candidate.sense,
  };
}
