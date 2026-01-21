// ------------------------------------------------------------
// selectCaveSentence
// ------------------------------------------------------------
// Chooses a cave sentence OR silence.
// This function is AUTHORITATIVE for cave narration.
// ------------------------------------------------------------

import {
  CaveEntropyRules,
  shouldBeSilent,
  shouldTriggerImpossible,
} from "./applySentenceEntropy";

import {
  getCaveSentencesForNode,
  markImpossibleLineUsed,
  hasImpossibleLineBeenUsed,
} from "./WindscarCave.sentences";

import type { CaveSentence } from "./WindscarCave.sentences";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type TribeProfile = {
  roles: Array<"hunter" | "gatherer" | "elder">;
};

type SelectionResult =
  | { type: "sentence"; sentence: CaveSentence }
  | { type: "omen"; sentence: CaveSentence }
  | { type: "impossible"; sentence: CaveSentence }
  | { type: "silence" };

/* ------------------------------------------------------------
   Perception Bias
------------------------------------------------------------ */

function perceptionWeight(
  sentence: CaveSentence,
  tribe: TribeProfile
): number {
  let weight = 1;

  for (const role of tribe.roles) {
    if (role === "hunter" && sentence.sense === "sound") {
      weight += 0.25;
    }
    if (role === "elder" && sentence.sense === "air") {
      weight += 0.35;
    }
    if (role === "elder" && sentence.sense === "memory") {
      weight += 0.45;
    }
  }

  return weight;
}

/* ------------------------------------------------------------
   Core Selection
------------------------------------------------------------ */

export function selectCaveSentence(
  nodeId: string,
  entropy: number,
  tribeProfile: TribeProfile
): SelectionResult {
  const sentences =
    getCaveSentencesForNode(nodeId);

  // ----------------------------------------------------------
  // Impossible Line (GLOBAL, ONCE EVER)
  // ----------------------------------------------------------

  if (
    shouldTriggerImpossible(entropy) &&
    !hasImpossibleLineBeenUsed()
  ) {
    const impossible = sentences.find(
      (s) => s.category === "impossible"
    );

    if (impossible) {
      markImpossibleLineUsed(impossible.id);
      return {
        type: "impossible",
        sentence: impossible,
      };
    }
  }

  // ----------------------------------------------------------
  // Silence (Wrong Silence Overrides Everything)
  // ----------------------------------------------------------

  if (shouldBeSilent(entropy)) {
    // Silence chance increases with entropy
    const silenceChance = Math.min(
      0.85,
      (entropy - CaveEntropyRules.silenceThreshold) * 1.6
    );

    if (Math.random() < silenceChance) {
      return { type: "silence" };
    }
  }

  // ----------------------------------------------------------
  // Candidate Pool
  // ----------------------------------------------------------

  const candidates = sentences.filter(
    (s) => s.category !== "impossible"
  );

  if (candidates.length === 0) {
    return { type: "silence" };
  }

  // ----------------------------------------------------------
  // Weighted Selection (Entropy + Perception)
  // ----------------------------------------------------------

  let weighted: Array<{
    sentence: CaveSentence;
    weight: number;
  }> = [];

  for (const s of candidates) {
    const freshnessWeight =
      Math.max(0.1, s.freshness);

    const perception =
      perceptionWeight(s, tribeProfile);

    const entropyPenalty =
      1 - Math.min(entropy, 0.9);

    const finalWeight =
      freshnessWeight *
      perception *
      entropyPenalty;

    weighted.push({
      sentence: s,
      weight: finalWeight,
    });
  }

  const totalWeight = weighted.reduce(
    (sum, w) => sum + w.weight,
    0
  );

  if (totalWeight <= 0.01) {
    return { type: "silence" };
  }

  // ----------------------------------------------------------
  // Roll Selection
  // ----------------------------------------------------------

  let roll = Math.random() * totalWeight;

  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) {
      return {
        type:
          entry.sentence.category === "omen"
            ? "omen"
            : "sentence",
        sentence: entry.sentence,
      };
    }
  }

  return { type: "silence" };
}
