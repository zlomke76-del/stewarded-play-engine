// ------------------------------------------------------------
// Windscar Cave — Narrative Intelligence Layer
// ------------------------------------------------------------
// Controls cave-specific perception, entropy, omens, silence,
// and impossible one-time lines.
// ------------------------------------------------------------

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type CaveSense =
  | "sound"
  | "air"
  | "heat"
  | "movement"
  | "memory";

export type CaveSentence = {
  id: string;
  sense: CaveSense;
  text: string;
  entropyCost: number; // 0.0 – 1.0
};

export type OmenLine = {
  threshold: number; // hazard risk %
  text: string;
};

/* ------------------------------------------------------------
   Sentence Pools (By Node)
------------------------------------------------------------ */

export const WindscarSentences: Record<
  string,
  CaveSentence[]
> = {
  // ----------------------------------------------------------
  // Depth 0 — Stone Overhang
  // ----------------------------------------------------------
  "windscar-overhang": [
    {
      id: "overhang-air-slip",
      sense: "air",
      text: "Wind slides past the stone lip, never quite entering.",
      entropyCost: 0.05,
    },
    {
      id: "overhang-muted-world",
      sense: "sound",
      text: "The world outside sounds farther away than it should.",
      entropyCost: 0.08,
    },
    {
      id: "overhang-shadow-long",
      sense: "movement",
      text: "Shadows stretch longer than the sun allows.",
      entropyCost: 0.1,
    },
  ],

  // ----------------------------------------------------------
  // Depth 1 — Narrow Tunnel
  // ----------------------------------------------------------
  "windscar-tunnel": [
    {
      id: "tunnel-breath-return",
      sense: "sound",
      text: "Breath returns before you finish exhaling.",
      entropyCost: 0.12,
    },
    {
      id: "tunnel-damp-walls",
      sense: "air",
      text: "The walls sweat when no one touches them.",
      entropyCost: 0.15,
    },
    {
      id: "tunnel-footfall-delay",
      sense: "movement",
      text: "Footsteps arrive a moment late.",
      entropyCost: 0.18,
    },
  ],

  // ----------------------------------------------------------
  // Depth 2 — Deep Chamber
  // ----------------------------------------------------------
  "windscar-deep-chamber": [
    {
      id: "chamber-fire-fails",
      sense: "heat",
      text: "Fire gives no comfort here.",
      entropyCost: 0.18,
    },
    {
      id: "chamber-remembers",
      sense: "memory",
      text: "Something here remembers being used.",
      entropyCost: 0.2,
    },
    {
      id: "chamber-weighted-air",
      sense: "air",
      text: "The air presses down instead of rising.",
      entropyCost: 0.22,
    },
  ],
};

/* ------------------------------------------------------------
   Collapse Omens (Tunnel & Deep Chamber)
------------------------------------------------------------ */

export const CollapseOmens: OmenLine[] = [
  {
    threshold: 40,
    text: "Dust falls without sound.",
  },
  {
    threshold: 60,
    text: "The stone answers itself.",
  },
  {
    threshold: 80,
    text: "Something shifts deeper than the walls.",
  },
];

/* ------------------------------------------------------------
   Flood Omens (Deep Chamber Only)
------------------------------------------------------------ */

export const FloodOmens: OmenLine[] = [
  {
    threshold: 40,
    text: "The floor cools unevenly.",
  },
  {
    threshold: 60,
    text: "Water finds paths you cannot see.",
  },
  {
    threshold: 80,
    text: "The chamber waits lower than it should.",
  },
];

/* ------------------------------------------------------------
   Wrong Silence (Rare, Non-exported)
------------------------------------------------------------ */

export const WrongSilenceLines: string[] = [
  "The cave does not echo.",
  "Your breathing has nowhere to go.",
  "Even the dark pauses.",
];

/* ------------------------------------------------------------
   Impossible Line (One-Time, Global)
------------------------------------------------------------ */

export const ImpossibleLine = {
  id: "windscar-impossible",
  text: "The cave is already empty of you.",
};

/* ------------------------------------------------------------
   Entropy Rules (Constants)
------------------------------------------------------------ */

export const CaveEntropyRules = {
  silenceThreshold: 0.7,
  impossibleThreshold: 0.95,
  scarIncrement: 1,
  maxScarsBeforeMutation: 2,
};

/* ------------------------------------------------------------
   Export Rules
------------------------------------------------------------ */
// IMPORTANT:
// - Silence is NEVER exported
// - Omens are NEVER labeled
// - Impossible line is NEVER exported
//
// Canon exports include outcomes only.
// Missing narration is intentional.
// ------------------------------------------------------------
