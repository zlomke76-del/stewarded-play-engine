// ------------------------------------------------------------
// Sentence Entropy Engine
// ------------------------------------------------------------
// Controls how cave narration decays, mutates, or falls silent.
// ------------------------------------------------------------

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type TribeProfile = {
  role: "hunter" | "elder" | "scout";
  entropySensitivity: number; // elders > hunters
};

export type SentenceMemory = {
  id: string;
  text: string;
  scars: number;
  usedCount: number;
  impossible?: boolean;
};

export type CaveEntropyState = {
  entropy: number;
  silence: boolean;
};

/* ------------------------------------------------------------
   Entropy Rules (Canonical)
------------------------------------------------------------ */

export const CaveEntropyRules = {
  silenceThreshold: 12,
  impossibleThreshold: 18,
  scarIncrement: 1,
  maxScarsBeforeMutation: 2,
};

/* ------------------------------------------------------------
   Core Engine
------------------------------------------------------------ */

export function applySentenceEntropy(
  state: CaveEntropyState,
  sentence: SentenceMemory,
  tribe: TribeProfile
): {
  nextState: CaveEntropyState;
  sentence: SentenceMemory;
  suppressed: boolean;
} {
  const entropyGain =
    tribe.entropySensitivity + 1;

  const nextEntropy =
    state.entropy + entropyGain;

  // 🔕 Silence overtakes narration
  if (nextEntropy >= CaveEntropyRules.silenceThreshold) {
    return {
      nextState: {
        entropy: nextEntropy,
        silence: true,
      },
      sentence,
      suppressed: true,
    };
  }

  // 🩸 Scar the sentence
  let nextSentence = { ...sentence };
  nextSentence.usedCount += 1;
  nextSentence.scars += CaveEntropyRules.scarIncrement;

  // 🧬 Mutation instead of repetition
  if (
    nextSentence.scars >=
    CaveEntropyRules.maxScarsBeforeMutation
  ) {
    nextSentence.text = mutateSentenceText(
      nextSentence.text
    );
    nextSentence.scars = 0;
  }

  return {
    nextState: {
      entropy: nextEntropy,
      silence: false,
    },
    sentence: nextSentence,
    suppressed: false,
  };
}

/* ------------------------------------------------------------
   Sentence Mutation (Scar Tissue)
------------------------------------------------------------ */

export function mutateSentenceText(
  text: string
): string {
  // Minimal, unsettling mutations
  if (text.includes("wind")) {
    return text.replace("wind", "air");
  }

  if (text.includes("sound")) {
    return text.replace("sound", "absence");
  }

  if (text.includes("dark")) {
    return text.replace("dark", "lightless");
  }

  return text + " (changed)";
}
