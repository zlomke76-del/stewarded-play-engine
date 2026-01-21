// ------------------------------------------------------------
// mutateSentenceText
// ------------------------------------------------------------
// Scar-tissue mutation for cave sentences.
// Lines do NOT repeat cleanly.
// They fray, shorten, shift tense, or hollow out.
// ------------------------------------------------------------

import type { CaveSentence } from "./WindscarCave.sentences";

/* ------------------------------------------------------------
   Mutation Rules
------------------------------------------------------------ */

const MutationRules = {
  // After this many scars, mutation begins
  minScarsToMutate: 1,

  // Maximum mutation severity
  maxSeverity: 4,

  // Probability that mutation escalates each scar
  escalationChance: 0.65,
};

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function maybe(prob: number): boolean {
  return Math.random() < prob;
}

/* ------------------------------------------------------------
   Mutation Strategies
------------------------------------------------------------ */

function erodeSentence(text: string): string {
  // Remove trailing certainty
  return text.replace(/[.!?]$/, "…");
}

function fragmentSentence(text: string): string {
  const parts = text.split(/[,;—]/);
  return parts[0]?.trim() ?? text;
}

function shiftTense(text: string): string {
  return text
    .replace(/\bis\b/g, "was")
    .replace(/\bare\b/g, "were")
    .replace(/\bfeels\b/g, "felt")
    .replace(/\bhears\b/g, "heard");
}

function hollowSentence(text: string): string {
  // Remove concrete nouns subtly
  return text.replace(
    /\b(stone|wind|fire|water|bones|walls|darkness)\b/gi,
    "something"
  );
}

/* ------------------------------------------------------------
   Core Mutation
------------------------------------------------------------ */

export function mutateSentenceText(
  sentence: CaveSentence,
  scars: number
): string {
  if (scars < MutationRules.minScarsToMutate) {
    return sentence.text;
  }

  const severity = clamp(
    Math.floor(scars / 1.5),
    1,
    MutationRules.maxSeverity
  );

  let text = sentence.text;

  // Mutations stack — but gently
  for (let i = 0; i < severity; i++) {
    if (!maybe(MutationRules.escalationChance)) continue;

    const roll = Math.random();

    if (roll < 0.25) {
      text = erodeSentence(text);
    } else if (roll < 0.5) {
      text = fragmentSentence(text);
    } else if (roll < 0.75) {
      text = shiftTense(text);
    } else {
      text = hollowSentence(text);
    }
  }

  // Final safeguard: never return empty
  if (!text || text.trim().length < 6) {
    return "Something here no longer speaks.";
  }

  return text;
}
