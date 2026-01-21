// ------------------------------------------------------------
// Cave Sentence Selection
// ------------------------------------------------------------
// Chooses a sentence based on:
// - Node
// - Entropy
// - Tribe perceptual bias
// - Impossible-line constraints
// ------------------------------------------------------------

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type TribeProfile = {
  role: "hunters" | "elders" | "general";
  entropySensitivity: number;
};

export type CaveSentence = {
  id: string;
  text: string;
  tags?: string[]; // e.g. ["sound", "air", "collapse"]
};

export type CaveSentenceResult = {
  sentence?: CaveSentence;
  usedImpossible: boolean;
};

/* ------------------------------------------------------------
   Sentence Pools (node-scoped)
------------------------------------------------------------ */

const SENTENCE_POOLS: Record<string, CaveSentence[]> = {
  "windscar-overhang": [
    {
      id: "wind-overhang-1",
      text: "Wind moves strangely here, as if split by stone.",
      tags: ["air"],
    },
    {
      id: "wind-overhang-2",
      text: "Loose gravel clicks once, then settles.",
      tags: ["sound"],
    },
  ],

  "windscar-tunnel": [
    {
      id: "wind-tunnel-1",
      text: "The tunnel breathes when no one moves.",
      tags: ["air", "omen"],
    },
    {
      id: "wind-tunnel-2",
      text: "A drip echoes too far for its size.",
      tags: ["sound"],
    },
  ],

  "windscar-deep-chamber": [
    {
      id: "wind-deep-1",
      text: "The chamber feels older than the hill above it.",
      tags: ["omen"],
    },
  ],
};

/* ------------------------------------------------------------
   Impossible Line (global, one-time)
------------------------------------------------------------ */

let IMPOSSIBLE_USED = false;

const IMPOSSIBLE_LINE: CaveSentence = {
  id: "impossible-void",
  text: "For a moment, the cave listens back.",
};

/* ------------------------------------------------------------
   Selection Logic
------------------------------------------------------------ */

export function selectCaveSentence(
  nodeId: string,
  entropy: number,
  tribe: TribeProfile,
  usedImpossible: boolean
): CaveSentenceResult {
  // Impossible line: one-time, high entropy only
  if (!IMPOSSIBLE_USED && entropy >= 14 && !usedImpossible) {
    IMPOSSIBLE_USED = true;
    return {
      sentence: IMPOSSIBLE_LINE,
      usedImpossible: true,
    };
  }

  const pool = SENTENCE_POOLS[nodeId] ?? [];
  if (pool.length === 0) return { usedImpossible: false };

  // Perception bias
  let filtered = pool;

  if (tribe.role === "hunters") {
    filtered = pool.filter(
      (s) => s.tags?.includes("sound") ?? false
    );
  }

  if (tribe.role === "elders") {
    filtered = pool.filter(
      (s) => s.tags?.includes("air") ?? false
    );
  }

  if (filtered.length === 0) filtered = pool;

  const sentence =
    filtered[Math.floor(Math.random() * filtered.length)];

  return {
    sentence,
    usedImpossible: false,
  };
}
