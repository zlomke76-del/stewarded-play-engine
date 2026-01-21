// ------------------------------------------------------------
// Cave Sentence Selection Engine
// ------------------------------------------------------------
// Chooses a sentence based on cave node, entropy,
// and tribe perception bias.
// ------------------------------------------------------------

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type TribeProfile = {
  role: "hunter" | "elder" | "scout";
  entropySensitivity: number;
};

export type SentencePoolEntry = {
  id: string;
  text: string;
  impossible?: boolean;
};

export type CaveSentenceResult = {
  sentence: SentencePoolEntry | null;
  reason:
    | "selected"
    | "silence"
    | "impossible-consumed";
};

/* ------------------------------------------------------------
   Sentence Pools (Windscar — minimal seed)
------------------------------------------------------------ */

const WindscarSentencePools: Record<
  string,
  SentencePoolEntry[]
> = {
  "windscar-overhang": [
    {
      id: "overhang-wind",
      text:
        "The wind skims the stone, never touching the ground.",
    },
    {
      id: "overhang-wrong-silence",
      text:
        "There is a silence here that does not belong.",
      impossible: true,
    },
  ],

  "windscar-tunnel": [
    {
      id: "tunnel-echo",
      text:
        "Each step returns as something smaller.",
    },
  ],

  "windscar-deep-chamber": [
    {
      id: "deep-damp",
      text:
        "Water gathers where light never argued.",
    },
  ],
};

/* ------------------------------------------------------------
   Selector
------------------------------------------------------------ */

export function selectCaveSentence(
  nodeId: string,
  entropy: number,
  tribe: TribeProfile,
  usedImpossible: Set<string>
): CaveSentenceResult {
  const pool =
    WindscarSentencePools[nodeId] ?? [];

  if (pool.length === 0) {
    return {
      sentence: null,
      reason: "silence",
    };
  }

  // Elders notice absence sooner
  if (
    tribe.role === "elder" &&
    entropy > 10
  ) {
    return {
      sentence: null,
      reason: "silence",
    };
  }

  // Filter impossible lines already used
  const available = pool.filter(
    (s) =>
      !s.impossible ||
      !usedImpossible.has(s.id)
  );

  if (available.length === 0) {
    return {
      sentence: null,
      reason: "silence",
    };
  }

  // Low entropy → stable lines
  const index =
    entropy < 6
      ? 0
      : Math.floor(
          Math.random() * available.length
        );

  const chosen = available[index];

  if (chosen.impossible) {
    return {
      sentence: chosen,
      reason: "impossible-consumed",
    };
  }

  return {
    sentence: chosen,
    reason: "selected",
  };
}
