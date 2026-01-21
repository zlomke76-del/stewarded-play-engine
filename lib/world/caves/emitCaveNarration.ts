// ------------------------------------------------------------
// emitCaveNarration
// ------------------------------------------------------------
// Single authoritative narration step for cave encounters.
// Solace-only. Deterministic. No side effects.
// ------------------------------------------------------------

import {
  applySentenceEntropy,
  CaveEntropyState,
  SentenceMemory,
  TribeProfile,
} from "./applySentenceEntropy";

import {
  selectCaveSentence,
  CaveSentenceResult,
} from "./selectCaveSentence";

import { CaveNode } from "./WindscarCave";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveNarrationContext = {
  caveNode: CaveNode;
  entropy: CaveEntropyState;
  memory: SentenceMemory;
  tribe: TribeProfile;

  // environmental signals
  turn: number;
  fireUsed: boolean;
  rested: boolean;
};

export type CaveNarrationResult = {
  line?: string; // undefined = silence
  kind: "sentence" | "omen" | "silence" | "impossible";
  entropy: CaveEntropyState;
  memory: SentenceMemory;

  // optional metadata (not exported to canon)
  debug?: {
    sentenceId?: string;
    entropyBefore: number;
    entropyAfter: number;
  };
};

/* ------------------------------------------------------------
   Core Function
------------------------------------------------------------ */

export function emitCaveNarration(
  ctx: CaveNarrationContext
): CaveNarrationResult {
  const {
    caveNode,
    entropy,
    memory,
    tribe,
    turn,
    fireUsed,
    rested,
  } = ctx;

  const entropyBefore = entropy.value;

  /* ----------------------------------------------------------
     Decide narration mode
  ---------------------------------------------------------- */

  let mode: CaveNarrationResult["kind"] =
    "sentence";

  // Impossible line: one-time global destabilizer
  if (
    entropy.value >= 0.92 &&
    !memory.impossibleUsed
  ) {
    mode = "impossible";
  }
  // Omen threshold
  else if (
    entropy.value >= 0.7 ||
    caveNode.hazards.collapseRisk > 30
  ) {
    mode = "omen";
  }
  // Silence chance grows with familiarity
  else if (
    entropy.familiarity > 0.6 &&
    Math.random() < 0.35
  ) {
    mode = "silence";
  }

  /* ----------------------------------------------------------
     Sentence selection (if any)
  ---------------------------------------------------------- */

  let sentenceResult: CaveSentenceResult | null =
    null;

  if (mode !== "silence") {
    sentenceResult = selectCaveSentence(
      caveNode.nodeId,
      entropy.value,
      tribe
    );
  }

  /* ----------------------------------------------------------
     Apply entropy shift
  ---------------------------------------------------------- */

  const entropyEvent =
    mode === "sentence" && sentenceResult
      ? {
          type: "sentence" as const,
          sentenceId:
            sentenceResult.sentenceId,
        }
      : { type: mode };

  const updated = applySentenceEntropy(
    entropy,
    entropyEvent,
    tribe,
    memory
  );

  /* ----------------------------------------------------------
     Compose narration line
  ---------------------------------------------------------- */

  let line: string | undefined;

  if (mode === "sentence" && sentenceResult) {
    line = sentenceResult.text;
  } else if (mode === "omen") {
    line = sentenceResult?.text;
  } else if (mode === "impossible") {
    line = sentenceResult?.text;
  }
  // silence → no line returned

  return {
    line,
    kind: mode,
    entropy: updated.entropy,
    memory: updated.memory,
    debug: {
      sentenceId:
        sentenceResult?.sentenceId,
      entropyBefore,
      entropyAfter: updated.entropy.value,
    },
  };
}
