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
  | "grounded"
  | "mythic"; // added

export type NarrativePressureLevel = "low" | "rising" | "high" | "critical";
export type NarrativeAwarenessStatus = "Quiet" | "Suspicious" | "Alerted";

/**
 * Optional, structured truth anchors for richer narration.
 * These DO NOT grant authority; they only constrain flavor to the known facts.
 */
export type NarrativeTruth = {
  // Optional recap seed (e.g., initial table / scene setup excerpt)
  setup?: string;

  // Optional movement anchor (exploration)
  movement?: {
    from?: { x: number; y: number };
    to?: { x: number; y: number };
    direction?: "north" | "east" | "south" | "west" | "none";
  };

  // Optional combat anchor
  combat?: {
    activeEnemyGroupName?: string | null;
    isEnemyTurn?: boolean;
    attackStyleHint?: "volley" | "beam" | "charge" | "unknown";
  };

  // Optional mechanical anchors (still non-authoritative)
  mechanics?: {
    dc?: number;
    roll?: number;
    margin?: number;
    success?: boolean;
    optionKind?: "safe" | "environmental" | "risky" | "contested";
  };

  // Optional dungeon tension anchors
  pressure?: {
    level: NarrativePressureLevel;
    label?: string; // e.g. "Low/Rising/High/Critical"
  };
  awareness?: {
    status: NarrativeAwarenessStatus;
    explanation?: string;
  };

  // Optional damage/effects anchor (only if the calling system has it)
  effects?: {
    damage?: number;
    damageType?: string;
    condition?: string;
  };
};

export interface NarrationInput {
  intentText: string;
  margin: number; // roll - dc (kept for backwards compatibility)
  lens?: NarrativeLens;
  seed?: number;

  /**
   * Optional truth anchors for deeper, grounded narration.
   * Safe to omit. When present, the narrator should reference them.
   */
  truth?: NarrativeTruth;

  /**
   * Optional: request slightly longer narration (still bounded).
   * 1.0 = short (old behavior), 1.5 = richer, 2.0 = mythic-with-anchors.
   * This is still deterministic if seed is provided.
   */
  depth?: 1 | 1.5 | 2;
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

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function safeTrim(s: string | undefined | null) {
  return (s ?? "").trim();
}

function dirArrow(d?: string) {
  switch (d) {
    case "north":
      return "↑";
    case "east":
      return "→";
    case "south":
      return "↓";
    case "west":
      return "←";
    default:
      return "";
  }
}

function formatTile(p?: { x: number; y: number }) {
  if (!p) return "";
  const x = typeof p.x === "number" ? p.x : null;
  const y = typeof p.y === "number" ? p.y : null;
  if (x === null || y === null) return "";
  return `(${x},${y})`;
}

/* ------------------------------------------------------------
   Core Generator
------------------------------------------------------------ */

export function generateNarration({
  intentText,
  margin,
  lens = "heroic",
  seed,
  truth,
  depth = 1.5,
}: NarrationInput): string {
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;

  const intentLower = intentText.toLowerCase();

  const stealth = /stealth|sneak|scout|hide|shadow/.test(intentLower);
  const magic = /spell|cantrip|detect|murmur|ritual|arcane|sigil/.test(intentLower);
  const martial = /sword|blade|grip|ready|guard|strike|shoot|arrow|aim/.test(intentLower);

  // --------------------------------------------
  // Outcome tier (derived from margin only)
  // --------------------------------------------

  let tier: "triumph" | "success" | "mixed" | "fail" | "disaster";

  if (margin >= 8) tier = "triumph";
  else if (margin >= 3) tier = "success";
  else if (margin >= 0) tier = "mixed";
  else if (margin >= -4) tier = "fail";
  else tier = "disaster";

  // --------------------------------------------
  // Phrase banks (tone)
  // --------------------------------------------

  const openings = {
    triumph: [
      "Everything clicks at once.",
      "For a heartbeat, the world cooperates.",
      "This is one of those rare moments where nothing resists.",
    ],
    success: ["The plan holds.", "Things unfold as hoped.", "The execution is clean enough to matter."],
    mixed: ["It works — but only barely.", "The margin is thin.", "You succeed, though not comfortably."],
    fail: ["Something slips.", "A small error ripples outward.", "The environment resists your intentions."],
    disaster: ["Multiple things go wrong at once.", "The situation unravels fast.", "Control is lost almost immediately."],
  };

  // Lens overlay (subtle, never changes truth)
  const lensSpice: Record<NarrativeLens, string[]> = {
    heroic: ["Courage carries the moment.", "You hold your nerve.", "You refuse to hesitate."],
    grim: ["The air feels heavier afterward.", "Nothing here forgives mistakes.", "The dungeon keeps its own tally."],
    mysterious: ["The silence seems arranged.", "Something watches without revealing itself.", "Meaning gathers in the corners."],
    grounded: ["It’s simple — and that’s why it works.", "The details matter.", "Your timing saves you."],
    mythic: [
      "For an instant, fate leans close.",
      "The world answers in omen and consequence.",
      "In this place, intention has weight.",
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
    triumph: ["You gain more than you expected.", "Momentum is fully yours."],
    success: ["You remain in control.", "Nothing presses you — yet."],
    mixed: ["You’re aware how close that was.", "This will matter later."],
    fail: ["You are no longer certain you’re unseen.", "Attention has been drawn."],
    disaster: ["You are reacting now, not choosing.", "Whatever comes next won’t wait."],
  };

  // Pressure / awareness beats (optional truth anchors)
  const pressureBeats: Record<NarrativePressureLevel, string[]> = {
    low: ["The dungeon is quiet enough to mistake for mercy.", "For now, the dark keeps its distance."],
    rising: ["Your presence lingers in the corridors.", "The place feels less empty than it did a moment ago."],
    high: ["The dungeon is beginning to respond.", "Somewhere nearby, the quiet rearranges itself into attention."],
    critical: [
      "This place is no longer merely watched — it is managed.",
      "The dungeon feels organized now. It is listening for you.",
    ],
  };

  const awarenessBeats: Record<NarrativeAwarenessStatus, string[]> = {
    Quiet: ["No clear reaction follows — only the steady breath of stone.", "If anything heard, it did not answer."],
    Suspicious: ["You sense curiosity in the dark — not fear, not calm.", "Somewhere, something pauses… and considers."],
    Alerted: ["The air feels sharpened, as if the dungeon has turned its head.", "Attention has become direction."],
  };

  // --------------------------------------------
  // Truth-anchor phrases (movement / combat)
  // --------------------------------------------

  const move = truth?.movement;
  const moveFrom = formatTile(move?.from);
  const moveTo = formatTile(move?.to);
  const moveArrow = dirArrow(move?.direction);
  const hasMove = !!move?.to && !!move?.from && moveFrom && moveTo;

  const combat = truth?.combat;
  const enemyName = safeTrim(combat?.activeEnemyGroupName ?? "");
  const hasEnemy = enemyName.length > 0;

  // --------------------------------------------
  // Assembly (bounded, mythic, grounded)
  // --------------------------------------------

  const lines: string[] = [];

  // 0) Optional setup reference (short, never too long)
  const setup = safeTrim(truth?.setup);
  if (depth >= 2 && setup) {
    // Keep it short: one clause, not a paragraph
    const setupClause = setup.length > 140 ? setup.slice(0, 140).trim() + "…" : setup;
    lines.push(setupClause);
  }

  // 1) Opening (tier)
  lines.push(pick(openings[tier], rand));

  // 2) Lens spice (small chance)
  if (depth >= 1.5 && rand() > 0.55) {
    lines.push(pick(lensSpice[lens], rand));
  }

  // 3) Action anchor: movement + intent (only if truth provided)
  if (depth >= 1.5 && hasMove) {
    // Keep this factual but flavorful
    const moveLineVariants = [
      `You shift ${moveArrow ? `${moveArrow} ` : ""}from ${moveFrom} to ${moveTo}, keeping your intent steady.`,
      `You take the ground from ${moveFrom} to ${moveTo}${moveArrow ? ` ${moveArrow}` : ""}, committing to the choice.`,
      `You advance from ${moveFrom} to ${moveTo}${moveArrow ? ` ${moveArrow}` : ""} — not fast, but deliberate.`,
    ];
    lines.push(pick(moveLineVariants, rand));
  } else if (depth >= 1.5) {
    // Fallback: reflect intent without claiming specific outcomes
    const intentLineVariants = [
      `You commit to it: ${intentText}.`,
      `You move on your intention — ${intentText}.`,
      `You try it, exactly as stated: ${intentText}.`,
    ];
    lines.push(pick(intentLineVariants, rand));
  }

  // 4) Domain flavor (stealth/magic/martial)
  if (stealth && rand() > 0.3) lines.push(pick(stealthLines, rand));
  if (magic && rand() > 0.3) lines.push(pick(magicLines, rand));
  if (martial && rand() > 0.3) lines.push(pick(martialLines, rand));

  // 5) Combat anchor (if enemy is present)
  if (depth >= 2 && hasEnemy) {
    const style = combat?.attackStyleHint ?? "unknown";
    const enemyBeat =
      style === "volley"
        ? [`${enemyName} answer with a measured volley, testing your rhythm.`, `${enemyName} loose a coordinated volley — not chaos, a pattern.`]
        : style === "beam"
        ? [`${enemyName} shape force into a line of intent — and let it speak.`, `A thin, ruthless beam answers from ${enemyName}.`]
        : style === "charge"
        ? [`${enemyName} surge forward, turning distance into threat.`, `${enemyName} turn the corridor into a battering path.`]
        : [`${enemyName} press the moment, looking for the crack you’ve shown.`, `${enemyName} don’t rush — they time you.`];

    lines.push(pick(enemyBeat as string[], rand));
  }

  // 6) Mechanical truth hint (optional): never states more than what’s known
  const mech = truth?.mechanics;
  if (depth >= 2 && mech && typeof mech.roll === "number" && typeof mech.dc === "number") {
    const m = typeof mech.margin === "number" ? mech.margin : mech.roll - mech.dc;
    const success = typeof mech.success === "boolean" ? mech.success : m >= 0;

    const mechLine = success
      ? `The edge goes your way — just enough to matter.`
      : `The moment slips; not failure alone, but consequence.`;

    // Small probability: include a quiet “roll vs DC” tell without showing numbers (keeps table vibe)
    const includeNumbers = rand() > 0.85;
    if (includeNumbers) {
      lines.push(`Fate reads ${mech.roll} against ${mech.dc}. ${mechLine}`);
    } else {
      lines.push(mechLine);
    }
  }

  // 7) Pressure + awareness beats (this is where “alive dungeon” comes in)
  if (truth?.pressure?.level) {
    const pLine = pick(pressureBeats[truth.pressure.level], rand);
    // For depth 1.5, include sometimes; for depth 2, include almost always
    const pChance = depth >= 2 ? 0.15 : 0.55;
    if (rand() > pChance) lines.push(pLine);
  }

  if (truth?.awareness?.status) {
    const aLine = pick(awarenessBeats[truth.awareness.status], rand);
    const aChance = depth >= 2 ? 0.2 : 0.6;
    if (rand() > aChance) lines.push(aLine);
  }

  // 8) Closing (tier)
  lines.push(pick(closings[tier], rand));

  // --------------------------------------------
  // Final stitching: keep bounded length
  // --------------------------------------------

  let out = lines.join(" ");

  // Soft cap to avoid runaway paragraphs in UI
  const maxChars = depth >= 2 ? 620 : 420;
  if (out.length > maxChars) out = out.slice(0, maxChars).trimEnd() + "…";

  return out;
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
