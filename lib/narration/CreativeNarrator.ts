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

export type NarrativeLens = "heroic" | "grim" | "mysterious" | "grounded" | "mythic";

export type AttackStyleHint = "volley" | "beam" | "charge" | "unknown";

export interface TruthAnchors {
  setup?: string;
  movement?: {
    from?: { x: number; y: number };
    to?: { x: number; y: number };
    direction?: "north" | "east" | "south" | "west" | "none";
  };
  combat?: {
    activeEnemyGroupName?: string;
    isEnemyTurn?: boolean;
    attackStyleHint?: AttackStyleHint;
  };
  mechanics?: {
    dc: number;
    roll: number;
    margin: number;
    success: boolean;
    optionKind?: "safe" | "environmental" | "risky" | "contested";
  };
}

export interface NarrationInput {
  intentText: string;
  margin: number; // roll - dc
  lens?: NarrativeLens;
  seed?: number;

  /**
   * How "thick" the narration should be.
   * - ~1.0: short
   * - ~1.5: table-friendly
   * - ~2.0: deeper (recap + action + consequence)
   */
  depth?: number;

  /**
   * Optional truth anchors to reference what happened.
   * Purely descriptive; grants no authority.
   */
  truth?: TruthAnchors;
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

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function cleanOneLine(s: string) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function dirWord(d?: string) {
  switch (d) {
    case "north":
      return "north";
    case "east":
      return "east";
    case "south":
      return "south";
    case "west":
      return "west";
    default:
      return "";
  }
}

function styleToPhrase(style: AttackStyleHint | undefined, enemyName?: string) {
  const e = enemyName ? `the ${enemyName}` : "they";
  switch (style) {
    case "volley":
      return `${e} set a line and loose in unison`;
    case "beam":
      return `${e} channel a focused surge of force`;
    case "charge":
      return `${e} lunge forward with sudden weight`;
    default:
      return `${e} press their advantage`;
  }
}

/* ------------------------------------------------------------
   Tiering (margin => outcome tone)
------------------------------------------------------------ */

type Tier = "triumph" | "success" | "mixed" | "fail" | "disaster";

function tierForMargin(margin: number): Tier {
  if (margin >= 8) return "triumph";
  if (margin >= 3) return "success";
  if (margin >= 0) return "mixed";
  if (margin >= -4) return "fail";
  return "disaster";
}

/* ------------------------------------------------------------
   Phrase banks by lens
------------------------------------------------------------ */

function banks(lens: NarrativeLens) {
  // Slightly different “voice” per lens, but still table-usable.
  const common = {
    sensory: [
      "Torchlight trembles against wet stone.",
      "A draft carries the taste of old iron.",
      "Your breath fogs, then thins in the cold.",
      "Somewhere deeper, water ticks like a slow clock.",
    ],
    tension: [
      "The dungeon listens in its own way.",
      "Silence stretches—then tightens.",
      "Even small sounds feel like they travel too far.",
      "For a moment, you can hear your own heartbeat.",
    ],
  } as const;

  if (lens === "mythic") {
    return {
      ...common,
      openings: {
        triumph: [
          "Fate leans close—and smiles.",
          "For a heartbeat, the world aligns with your will.",
          "The moment opens like a door that was always meant for you.",
        ],
        success: [
          "The weave holds.",
          "You take the moment and shape it.",
          "Your intent finds purchase in the world.",
        ],
        mixed: [
          "It works—yet not cleanly.",
          "You gain ground, but pay for it in breath and time.",
          "The dungeon yields… reluctantly.",
        ],
        fail: [
          "The world resists your hand.",
          "A small misstep becomes an invitation to trouble.",
          "Your intent meets stone and shadow—and slips.",
        ],
        disaster: [
          "The moment fractures in your grasp.",
          "Misfortune arrives with speed and certainty.",
          "The dungeon answers—loudly.",
        ],
      } as const,
      closings: {
        triumph: [
          "You gain more than you sought.",
          "Momentum is yours, unmistakably.",
          "Even the dark seems to hesitate.",
        ],
        success: [
          "You keep control—for now.",
          "Nothing breaks… and that matters.",
          "You hold the line of the story.",
        ],
        mixed: [
          "You feel how thin the margin was.",
          "It will echo later.",
          "You advance—wary, but advancing.",
        ],
        fail: [
          "Attention has been drawn.",
          "You’re no longer sure what heard you.",
          "Something shifts in the dark, in answer.",
        ],
        disaster: [
          "You’re reacting now, not choosing.",
          "Whatever comes next will not wait.",
          "The dungeon takes its turn.",
        ],
      } as const,
    };
  }

  if (lens === "grim") {
    return {
      ...common,
      openings: {
        triumph: ["You win, but it’s ugly.", "It works—against the odds.", "Luck favors you once."],
        success: ["It works.", "You get what you wanted.", "You force it through."],
        mixed: ["You scrape by.", "It works, but costs you.", "Not clean. Not safe."],
        fail: ["It doesn’t take.", "You misjudge the moment.", "The place pushes back."],
        disaster: ["It goes bad fast.", "The worst version happens.", "Everything slips at once."],
      } as const,
      closings: {
        triumph: ["You’re still standing.", "You bought time.", "You keep breathing."],
        success: ["You survive it.", "You keep moving.", "You don’t lose ground."],
        mixed: ["You feel the debt.", "You can’t do that again.", "It leaves a mark."],
        fail: ["They noticed.", "You’re exposed.", "You’re late by a heartbeat."],
        disaster: ["Now you bleed for it.", "Now you pay in full.", "Now it’s a fight."],
      } as const,
    };
  }

  if (lens === "mysterious") {
    return {
      ...common,
      openings: {
        triumph: ["The unseen parts cooperate.", "A pattern reveals itself.", "The silence favors you."],
        success: ["The threads line up.", "You read the moment right.", "The hidden door opens a crack."],
        mixed: ["You see enough—barely.", "You gain the clue, not the comfort.", "The answer arrives with a warning."],
        fail: ["The truth stays out of reach.", "The shadows keep their secret.", "You misread the signs."],
        disaster: ["Something watches you fail.", "The secret bites back.", "The wrong door opens."],
      } as const,
      closings: {
        triumph: ["You learn more than you meant to.", "The place reveals a weakness.", "The mystery bends."],
        success: ["You hold the thread.", "You keep the clue.", "You don’t get lost."],
        mixed: ["The clue costs you.", "The thread frays.", "The answer is partial."],
        fail: ["The trail goes cold.", "Your presence lingers.", "The shadows shift."],
        disaster: ["The secret wakes.", "The place remembers you.", "The dark moves first."],
      } as const,
    };
  }

  if (lens === "grounded") {
    return {
      ...common,
      openings: {
        triumph: ["Everything goes right.", "You execute cleanly.", "You get a clear win."],
        success: ["You pull it off.", "The plan works.", "You get what you wanted."],
        mixed: ["You succeed, barely.", "It works with friction.", "You get the result, not the grace."],
        fail: ["You miss the window.", "You slip.", "The environment resists you."],
        disaster: ["You lose control.", "It cascades.", "The situation worsens fast."],
      } as const,
      closings: {
        triumph: ["You press the advantage.", "You gain time.", "You improve your position."],
        success: ["You stay in control.", "You keep moving.", "You don’t give up ground."],
        mixed: ["You’re exposed a little.", "You burn time.", "It’s not free."],
        fail: ["You draw attention.", "You lose position.", "You leave a trace."],
        disaster: ["You’re on the back foot.", "You invite retaliation.", "You’re forced to react."],
      } as const,
    };
  }

  // heroic default
  return {
    ...common,
    openings: {
      triumph: ["Everything clicks at once.", "For a heartbeat, the world cooperates.", "This is your moment."],
      success: ["The plan holds.", "Things unfold as hoped.", "Your execution is clean enough to matter."],
      mixed: ["It works — but only barely.", "The margin is thin.", "You succeed, though not comfortably."],
      fail: ["Something slips.", "A small error ripples outward.", "The environment resists your intention."],
      disaster: ["Multiple things go wrong at once.", "The situation unravels fast.", "Control is lost almost immediately."],
    } as const,
    closings: {
      triumph: ["You gain more than you expected.", "Momentum is fully yours."],
      success: ["You remain in control.", "Nothing presses you — yet."],
      mixed: ["You’re aware how close that was.", "This will matter later."],
      fail: ["You are no longer certain you’re unseen.", "Attention has been drawn."],
      disaster: ["You are reacting now, not choosing.", "Whatever comes next won’t wait."],
    } as const,
  };
}

/* ------------------------------------------------------------
   Core Generator
------------------------------------------------------------ */

export function generateNarration(input: NarrationInput): string {
  const {
    intentText,
    margin,
    lens = "heroic",
    seed,
    depth = 1.25,
    truth,
  } = input;

  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const tier = tierForMargin(margin);
  const b = banks(lens);

  const wantDepth = clamp(depth, 0.75, 2.25);

  // Heuristic tags (still allowed; truth anchors override where present)
  const intentLower = String(intentText || "").toLowerCase();
  const stealth = /stealth|sneak|scout|hide|shadow|quiet/.test(intentLower);
  const magic = /spell|cantrip|detect|murmur|ritual|ward|sigil/.test(intentLower);
  const martial = /sword|blade|grip|ready|guard|strike|slash|shoot|arrow|bolt/.test(intentLower);

  // --- Truth-derived snippets (only if provided) ---
  const setupSnippet = truth?.setup ? cleanOneLine(truth.setup).slice(0, 220) : "";
  const from = truth?.movement?.from;
  const to = truth?.movement?.to;
  const direction = truth?.movement?.direction;
  const dir = dirWord(direction);
  const hasMove = !!(from && to && dir && dir !== "none");
  const moveSnippet = hasMove ? `You shift ${dir} from (${from!.x},${from!.y}) to (${to!.x},${to!.y}).` : "";

  const enemyName = truth?.combat?.activeEnemyGroupName;
  const styleHint = truth?.combat?.attackStyleHint ?? "unknown";
  const isEnemyTurn = !!truth?.combat?.isEnemyTurn;
  const enemySnippet =
    enemyName && isEnemyTurn
      ? `Enemy pressure rises: ${styleToPhrase(styleHint, enemyName)}.`
      : "";

  const mechanicsSnippet =
    truth?.mechanics
      ? `Roll ${truth.mechanics.roll} vs DC ${truth.mechanics.dc} (${truth.mechanics.margin >= 0 ? "+" : ""}${truth.mechanics.margin}).`
      : "";

  // --- Assembly ---
  const lines: string[] = [];

  // 0) Optional sensory preface for higher depth
  if (wantDepth >= 1.75) {
    lines.push(pick(b.sensory, rand));
  }

  // 1) Opening (tier)
  lines.push(pick(b.openings[tier], rand));

  // 2) Recap / anchoring (truth-driven) for mythic/solace-deeper
  if (wantDepth >= 1.6 && setupSnippet) {
    lines.push(`From the scene’s edge: ${setupSnippet}`);
  }

  // 3) Action beat (movement + intent)
  if (wantDepth >= 1.35 && moveSnippet) {
    lines.push(moveSnippet);
  }

  // Intent always included, but phrasing varies with depth
  if (wantDepth >= 1.75) {
    lines.push(`You commit: ${cleanOneLine(intentText)}.`);
  } else {
    lines.push(cleanOneLine(intentText));
  }

  // 4) Enemy/combat beat if present (kept short)
  if (wantDepth >= 1.35 && enemySnippet) {
    lines.push(enemySnippet);
  }

  // 5) Optional “texture” lines based on heuristics
  const texturePool: string[] = [];
  if (stealth) texturePool.push("You measure every sound you make.");
  if (magic) texturePool.push("The air answers your will with a low, uncertain hum.");
  if (martial) texturePool.push("Steel and instinct align for a single decisive moment.");

  if (wantDepth >= 1.45 && texturePool.length > 0 && rand() > 0.25) {
    // One texture line max (keeps it table-friendly)
    lines.push(pick(texturePool, rand));
  }

  // 6) Mechanics callout (optional, controlled)
  if (wantDepth >= 1.9 && mechanicsSnippet) {
    lines.push(mechanicsSnippet);
  }

  // 7) Closing (tier)
  lines.push(pick(b.closings[tier], rand));

  // Final formatting: ensure it reads as 1–2 paragraphs, not a wall.
  // For depth >= 2: add a deliberate line break around the middle.
  const joined = lines.join(" ");
  if (wantDepth >= 1.95) {
    const mid = Math.floor(lines.length / 2);
    const a = lines.slice(0, mid).join(" ");
    const c = lines.slice(mid).join(" ");
    return `${a}\n\n${c}`.trim();
  }

  return joined.trim();
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
