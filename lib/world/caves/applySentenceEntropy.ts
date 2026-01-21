// ------------------------------------------------------------
// Sentence Entropy Engine
// ------------------------------------------------------------
// Handles:
// - Entropy increase from silence / sentences
// - Sentence scarring and mutation
// - One-way degradation of narrative certainty
// ------------------------------------------------------------

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveEntropyState = number;

export type SentenceKind = "sentence" | "omen" | "silence";

export type TribeProfile = {
  role: "hunters" | "elders" | "general";
  entropySensitivity: number; // elders > hunters > general
};

export type SentenceMemory = {
  scars: Record<string, number>; // sentenceId → scar count
};

export type CaveSentence = {
  id: string;
  text: string;
};

/* ------------------------------------------------------------
   Entropy Rules (canonical)
------------------------------------------------------------ */

export const CaveEntropyRules = {
  silenceThreshold: 6,
  impossibleThreshold: 14,
  scarIncrement: 1,
  maxScarsBeforeMutation: 3,
  baseSentenceEntropy: 1,
  omenEntropy: 2,
  silenceEntropy: 0.5,
};

/* ------------------------------------------------------------
   Mutation helper
------------------------------------------------------------ */

function mutateSentenceText(
  text: string,
  scars: number
): string {
  if (scars < CaveEntropyRules.maxScarsBeforeMutation) {
    return text;
  }

  // Scar mutation: subtle distortion, not parody
  return text
    .replace(/still/g, "no longer")
    .replace(/quiet/g, "thin")
    .replace(/warm/g, "fading");
}

/* ------------------------------------------------------------
   Entropy Application
------------------------------------------------------------ */

export function applySentenceEntropy(
  entropy: CaveEntropyState,
  kind: SentenceKind,
  memory: SentenceMemory,
  sentence?: CaveSentence
): {
  text: string;
  entropyAfter: CaveEntropyState;
} {
  let entropyDelta = 0;
  let text = "";

  switch (kind) {
    case "sentence":
      entropyDelta = CaveEntropyRules.baseSentenceEntropy;
      break;

    case "omen":
      entropyDelta = CaveEntropyRules.omenEntropy;
      break;

    case "silence":
      entropyDelta = CaveEntropyRules.silenceEntropy;
      return {
        text: "",
        entropyAfter: entropy + entropyDelta,
      };
  }

  if (sentence) {
    const scars =
      (memory.scars[sentence.id] ?? 0) +
      CaveEntropyRules.scarIncrement;

    memory.scars[sentence.id] = scars;

    text = mutateSentenceText(sentence.text, scars);
  }

  return {
    text,
    entropyAfter: entropy + entropyDelta,
  };
}
