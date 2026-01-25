// ------------------------------------------------------------
// CreativeNarrator.ts
// ------------------------------------------------------------
// Creative-only narration engine (NON-AUTHORITATIVE)
//
// Purpose:
// - Generate rich, varied narration for outcomes
// - Use intent + margin as signal, not instruction
// - Never decide outcomes
// - Never mutate state
// - Never override humans
//
// This is flavor. Dice still rule.
// ------------------------------------------------------------

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type NarrativeLens =
  | "heroic"
  | "grim"
  | "mysterious"
  | "grounded";

export interface NarrationInput {
  intentText: string;
  margin: number; // roll - dc
  lens?: NarrativeLens;
  seed?: number;
}

/* ------------------------------------------------------------
   Deterministic RNG (seeded, optional)
------------------------------------------------------------ */

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

/* ------------------------------------------------------------
   Core Generator
------------------------------------------------------------ */

export function generateNarration({
  intentText,
  margin,
  lens = "heroic",
  seed,
}: NarrationInput): string {
  const rand =
    seed !== undefined
      ? seededRandom(seed)
      : Math.random;

  const intent = intentText.toLowerCase();

  const stealth = /stealth|sneak|scout|hide|shadow/.test(
    intent
  );
  const magic = /spell|cantrip|detect|murmur|ritual/.test(
    intent
  );
  const martial = /sword|blade|grip|ready|guard/.test(
    intent
  );

  // --------------------------------------------
  // Outcome tier
  // --------------------------------------------

  let tier: "triumph" | "success" | "mixed" | "fail" | "disaster";

  if (margin >= 8) tier = "triumph";
  else if (margin >= 3) tier = "success";
  else if (margin >= 0) tier = "mixed";
  else if (margin >= -4) tier = "fail";
  else tier = "disaster";

  // --------------------------------------------
  // Phrase banks
  // --------------------------------------------

  const openings = {
    triumph: [
      "Everything clicks at once.",
      "For a heartbeat, the world cooperates.",
      "This is one of those rare moments where nothing resists.",
    ],
    success: [
      "The plan holds.",
      "Things unfold as hoped.",
      "The execution is clean enough to matter.",
    ],
    mixed: [
      "It works — but only barely.",
      "The margin is thin.",
      "You succeed, though not comfortably.",
    ],
    fail: [
      "Something slips.",
      "A small error ripples outward.",
      "The environment resists your intentions.",
    ],
    disaster: [
      "Multiple things go wrong at once.",
      "The situation unravels fast.",
      "Control is lost almost immediately.",
    ],
  };

  const stealthLines = [
    "Footsteps fade where they shouldn’t.",
    "A shadow moves where no one should be standing.",
    "Silence stretches, then tightens.",
  ];

  const magicLines = [
    "The magic reveals absence — not safety.",
    "Your senses brush against something watching back.",
    "The spell hums, incomplete but suggestive.",
  ];

  const martialLines = [
    "Hands tighten on weapons.",
    "Steel shifts, just slightly too loud.",
    "Instinct pulls you toward readiness.",
  ];

  const closings = {
    triumph: [
      "You gain more than you expected.",
      "Momentum is fully yours.",
    ],
    success: [
      "You remain in control.",
      "Nothing presses you — yet.",
    ],
    mixed: [
      "You’re aware how close that was.",
      "This will matter later.",
    ],
    fail: [
      "You are no longer certain you’re unseen.",
      "Attention has been drawn.",
    ],
    disaster: [
      "You are reacting now, not choosing.",
      "Whatever comes next won’t wait.",
    ],
  };

  // --------------------------------------------
  // Assembly
  // --------------------------------------------

  const lines: string[] = [];

  lines.push(pick(openings[tier], rand));

  if (stealth && rand() > 0.3)
    lines.push(pick(stealthLines, rand));
  if (magic && rand() > 0.3)
    lines.push(pick(magicLines, rand));
  if (martial && rand() > 0.3)
    lines.push(pick(martialLines, rand));

  lines.push(pick(closings[tier], rand));

  return lines.join(" ");
}

/* ------------------------------------------------------------
   HARD BANS (By Design)
------------------------------------------------------------ */
// - No state access
// - No dice rolling
// - No authority
// - No outcome determination
// - No session memory
//
// This engine speaks only when invited.
// ------------------------------------------------------------
