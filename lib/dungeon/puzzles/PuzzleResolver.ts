// lib/dungeon/puzzles/PuzzleResolver.ts
// ------------------------------------------------------------
// Echoes of Fate — Puzzle Resolver
// ------------------------------------------------------------
// Purpose:
// - Deterministically resolve puzzle attempts from typed input text
// - Keep puzzle gameplay separated from narration and room generation
// - Emit typed effects / canon suggestions without mutating runtime
// ------------------------------------------------------------

import type { PuzzleId } from "@/lib/dungeon/FloorState";
import type {
  PuzzleAttemptInput,
  PuzzleCanonRecord,
  PuzzleResolution,
  PuzzleResolutionEffect,
  PuzzleSuggestedEvent,
} from "@/lib/dungeon/puzzles/PuzzleState";

function normalizeText(v: unknown): string {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function lower(v: unknown): string {
  return normalizeText(v).toLowerCase();
}

function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function deterministicRoll(seed: string, sides = 20): number {
  return (hash32(seed) % sides) + 1;
}

function containsAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function firstQuotedWord(text: string): string | null {
  const quoted =
    text.match(/["“']([^"”']{1,40})["”']/)?.[1] ??
    text.match(/\bdeclare(?:s|d|ing)?\s+([a-zA-Z-]{2,24})\b/i)?.[1] ??
    text.match(/\bconfess(?:es|ed|ing)?\s+([a-zA-Z-]{2,40})\b/i)?.[1] ??
    null;

  if (!quoted) return null;
  return normalizeText(quoted);
}

function summarizeWord(word: string | null): string {
  return word ? word : "an unnamed answer";
}

function buildBaseSuggestedEvents(input: PuzzleAttemptInput): PuzzleSuggestedEvent[] {
  return [
    {
      type: "PUZZLE_ATTEMPTED",
      payload: {
        puzzleId: input.puzzleId,
        floorId: input.floorId,
        roomId: input.roomId,
        inputText: input.inputText,
      },
    },
  ];
}

function buildResolvedEvent(args: {
  input: PuzzleAttemptInput;
  success: boolean;
  details?: Record<string, unknown>;
}): PuzzleSuggestedEvent {
  return {
    type: "PUZZLE_RESOLVED",
    payload: {
      puzzleId: args.input.puzzleId,
      floorId: args.input.floorId,
      roomId: args.input.roomId,
      success: args.success,
      ...(args.details ?? {}),
    },
  };
}

function buildRewardEvents(
  input: PuzzleAttemptInput,
  effects: PuzzleResolutionEffect[]
): PuzzleSuggestedEvent[] {
  return effects.map((effect) => ({
    type:
      effect.kind === "apply_penalty" ||
      effect.kind === "lock_companion_path" ||
      effect.kind === "modify_pressure" ||
      effect.kind === "modify_awareness"
        ? "PUZZLE_CONSEQUENCE_APPLIED"
        : "PUZZLE_REWARD_GRANTED",
    payload: {
      puzzleId: input.puzzleId,
      floorId: input.floorId,
      roomId: input.roomId,
      effect,
    },
  }));
}

function successResolution(args: {
  input: PuzzleAttemptInput;
  title: string;
  summary: string;
  narration: string[];
  effects?: PuzzleResolutionEffect[];
  canon?: PuzzleCanonRecord[];
  parsedIntent?: Record<string, unknown>;
  score?: number;
}): PuzzleResolution {
  const effects = args.effects ?? [];
  return {
    ok: true,
    puzzleId: args.input.puzzleId,
    title: args.title,
    summary: args.summary,
    success: true,
    narration: args.narration,
    effects,
    canon: [
      {
        type: "puzzle_resolved",
        puzzleId: args.input.puzzleId,
        floorId: args.input.floorId,
        roomId: args.input.roomId,
        success: true,
        details: args.parsedIntent,
      },
      ...(args.canon ?? []),
    ],
    suggestedEvents: [
      ...buildBaseSuggestedEvents(args.input),
      buildResolvedEvent({
        input: args.input,
        success: true,
        details: args.parsedIntent,
      }),
      ...buildRewardEvents(args.input, effects),
    ],
    parsedIntent: args.parsedIntent,
    score: args.score,
  };
}

function failureResolution(args: {
  input: PuzzleAttemptInput;
  title: string;
  summary: string;
  narration: string[];
  effects?: PuzzleResolutionEffect[];
  canon?: PuzzleCanonRecord[];
  parsedIntent?: Record<string, unknown>;
  score?: number;
}): PuzzleResolution {
  const effects = args.effects ?? [];
  return {
    ok: true,
    puzzleId: args.input.puzzleId,
    title: args.title,
    summary: args.summary,
    success: false,
    narration: args.narration,
    effects,
    canon: [
      {
        type: "puzzle_resolved",
        puzzleId: args.input.puzzleId,
        floorId: args.input.floorId,
        roomId: args.input.roomId,
        success: false,
        details: args.parsedIntent,
      },
      ...(args.canon ?? []),
    ],
    suggestedEvents: [
      ...buildBaseSuggestedEvents(args.input),
      buildResolvedEvent({
        input: args.input,
        success: false,
        details: args.parsedIntent,
      }),
      ...buildRewardEvents(args.input, effects),
    ],
    parsedIntent: args.parsedIntent,
    score: args.score,
  };
}

function invalidResolution(input: PuzzleAttemptInput, reason: string): PuzzleResolution {
  return {
    ok: false,
    puzzleId: input.puzzleId,
    title: "Puzzle Attempt Incomplete",
    summary: reason,
    success: false,
    narration: [reason],
    effects: [],
    canon: [],
    suggestedEvents: buildBaseSuggestedEvents(input),
    parsedIntent: {},
  };
}

function resolveWhisperingAnvil(input: PuzzleAttemptInput): PuzzleResolution {
  const text = lower(input.inputText);
  const word = firstQuotedWord(input.inputText)?.toLowerCase() ?? null;

  if (!containsAny(text, ["strike", "hit", "hammer", "anvil"])) {
    return invalidResolution(
      input,
      "The anvil does not answer until the attempt clearly includes striking it."
    );
  }

  if (!word) {
    return invalidResolution(
      input,
      "The room expects a single declared sacrifice word."
    );
  }

  const virtuousWords = [
    "mercy",
    "hope",
    "silence",
    "patience",
    "grace",
    "duty",
    "truth",
    "rest",
    "fear",
    "pride",
  ];
  const selfishWords = [
    "power",
    "gold",
    "dominion",
    "glory",
    "control",
    "revenge",
    "vengeance",
  ];

  const roll = deterministicRoll(
    `${input.floorId}:${input.roomId}:${input.inputText}:${word}:whispering_anvil`
  );
  const dc = 12;
  const virtueBonus = virtuousWords.includes(word) ? 3 : 0;
  const selfishPenalty = selfishWords.includes(word) ? -3 : 0;
  const score = roll + virtueBonus + selfishPenalty;

  const parsedIntent = {
    declaredWord: word,
    roll,
    dc,
    finalScore: score,
  };

  if (score >= dc && !selfishWords.includes(word)) {
    const traitId = `${word}_edge`;
    return successResolution({
      input,
      title: "The Whispering Anvil",
      summary: `The anvil accepts ${summarizeWord(word)} and binds it into the hero's ledger.`,
      narration: [
        `The strike lands cleanly, and the forge answers with a low echo that does not fade with the room.`,
        `Your word — ${word} — feels recorded rather than merely spoken.`,
        `Something in the dungeon now remembers that choice.`,
      ],
      effects: [
        {
          kind: "grant_trait",
          traitId,
          label: `${word[0].toUpperCase()}${word.slice(1)}'s Edge`,
          description: `Permanent echo trait bound to the declared sacrifice: ${word}.`,
          value: 2,
        },
        {
          kind: "modify_pressure",
          delta: 8,
          description:
            "The next dangerous room grows slightly harsher because the dungeon registered the choice.",
        },
      ],
      canon: [
        {
          type: "trait_gained",
          traitId,
          label: `${word[0].toUpperCase()}${word.slice(1)}'s Edge`,
          details: { declaredWord: word },
        },
      ],
      parsedIntent,
      score,
    });
  }

  return failureResolution({
    input,
    title: "The Whispering Anvil",
    summary: `The anvil rejects ${summarizeWord(word)} and answers with fracture instead of blessing.`,
    narration: [
      `The blow rings wrong.`,
      `A crack runs through the anvil face, and the chamber answers by withholding something rather than granting it.`,
      `The dungeon records the failure as seriously as it would have recorded the vow.`,
    ],
    effects: [
      {
        kind: "lock_companion_path",
        companionTag: "compassion_healer",
        label: "Compassion Path Locked",
        description:
          "A future compassionate companion path is locked until a later restorative condition is met.",
      },
      {
        kind: "set_echo_flag",
        flag: "whispering_anvil_failed_word",
        value: word,
        description: "The rejected word is preserved in the campaign echo.",
      },
    ],
    canon: [
      {
        type: "companion_lock",
        companionTag: "compassion_healer",
        reason: `Rejected anvil word: ${word}`,
        details: { declaredWord: word },
      },
    ],
    parsedIntent,
    score,
  });
}

function resolveMirrorOfRegrets(input: PuzzleAttemptInput): PuzzleResolution {
  const text = normalizeText(input.inputText);
  const lowerText = lower(text);

  if (!containsAny(lowerText, ["regret", "confess", "i ", "should", "wrong", "failed"])) {
    return invalidResolution(
      input,
      "The mirror does not respond to empty posture. The attempt needs an actual regret or confession."
    );
  }

  const sinceritySignals = [
    "i regret",
    "i should have",
    "i was wrong",
    "i chose",
    "i failed",
    "instead of",
    "because i",
  ];

  const evasiveSignals = [
    "maybe",
    "sort of",
    "kind of",
    "not really",
    "whatever",
    "fine",
  ];

  let sincerity = 0;
  if (containsAny(lowerText, sinceritySignals)) sincerity += 3;
  if (text.length >= 40) sincerity += 2;
  if (containsAny(lowerText, ["power", "mercy", "door", "companion", "attack", "left", "abandoned"])) sincerity += 2;
  if (containsAny(lowerText, evasiveSignals)) sincerity -= 2;

  const roll = deterministicRoll(
    `${input.floorId}:${input.roomId}:${text}:mirror_of_regrets`
  );
  const dc = 10;
  const score = roll + sincerity;

  const parsedIntent = {
    confession: text,
    sincerity,
    roll,
    dc,
    finalScore: score,
  };

  if (score >= dc) {
    return successResolution({
      input,
      title: "The Mirror of Unspoken Regrets",
      summary: "The mirror accepts the confession and returns strength instead of distortion.",
      narration: [
        `The reflection holds your words longer than comfort would allow.`,
        `Then the surface fractures with approval rather than violence.`,
        `What returns is not forgiveness, but usable clarity.`,
      ],
      effects: [
        {
          kind: "grant_trait",
          traitId: "second_wind_echo",
          label: "Second Wind",
          description:
            "A one-time powerful recovery effect granted by honest confession.",
          value: 1,
        },
      ],
      canon: [
        {
          type: "trait_gained",
          traitId: "second_wind_echo",
          label: "Second Wind",
          details: { confession: text },
        },
      ],
      parsedIntent,
      score,
    });
  }

  return failureResolution({
    input,
    title: "The Mirror of Unspoken Regrets",
    summary: "The mirror rejects the confession as incomplete or evasive.",
    narration: [
      `The reflection does not crack.`,
      `Instead, it stabilizes into a version of you that looks more diminished than wounded.`,
      `The room keeps the truth you refused to carry properly.`,
    ],
    effects: [
      {
        kind: "apply_penalty",
        penaltyId: "mirror_evasion_brand",
        label: "Mirror Evasion",
        description:
          "Temporary stat penalty caused by an insincere or weak confession.",
        value: -1,
        duration: "run",
      },
    ],
    parsedIntent,
    score,
  });
}

function resolvePressureGauges(input: PuzzleAttemptInput): PuzzleResolution {
  const text = lower(input.inputText);

  const symbols = ["sword", "shield", "flame", "eye", "hand", "heart"];
  const mentionedSymbols = symbols.filter((symbol) => text.includes(symbol));

  if (mentionedSymbols.length < 3) {
    return invalidResolution(
      input,
      "The pressure hall needs a declared sequence with enough symbolic detail to evaluate."
    );
  }

  const cleverTools = [
    "throw",
    "dagger",
    "axe",
    "hellspark",
    "torch",
    "rope",
    "hook",
    "stone",
    "kick",
  ];

  const ingenuity = mentionedSymbols.length + (containsAny(text, cleverTools) ? 2 : 0);
  const roll = deterministicRoll(
    `${input.floorId}:${input.roomId}:${input.inputText}:pressure_gauges`
  );
  const dc = 13;
  const score = roll + ingenuity;

  const parsedIntent = {
    sequence: mentionedSymbols,
    ingenuity,
    roll,
    dc,
    finalScore: score,
  };

  if (score >= dc) {
    return successResolution({
      input,
      title: "The Pressure Gauges",
      summary: "The hall accepts the sequence and records it as a future fellowship key.",
      narration: [
        `The first plates answer with grinding resistance, then the hall begins to cooperate.`,
        `The sequence holds long enough for the mechanism to recognize not just order, but intent.`,
        `Somewhere deeper in the campaign, this pattern will matter again.`,
      ],
      effects: [
        {
          kind: "set_echo_flag",
          flag: "pressure_gauges_sequence",
          value: mentionedSymbols.join(">"),
          description: "Records the successful sequence for a future fellowship unlock.",
        },
      ],
      parsedIntent,
      score,
    });
  }

  return failureResolution({
    input,
    title: "The Pressure Gauges",
    summary: "The hall rejects the sequence and answers with collapsing pressure.",
    narration: [
      `The symbols answer out of order.`,
      `Stone answers stone, and what was a puzzle becomes a threat.`,
      `The room remembers the mistake as part of your pattern.`,
    ],
    effects: [
      {
        kind: "apply_penalty",
        penaltyId: "crushing_hall_wounds",
        label: "Crushing Hall Wounds",
        description: "Damage and strain from a failed pressure sequence.",
        value: -2,
        duration: "floor",
      },
      {
        kind: "modify_pressure",
        delta: 10,
        description: "Failure increases local pressure.",
      },
    ],
    parsedIntent,
    score,
  });
}

function resolveGenericPuzzle(input: PuzzleAttemptInput): PuzzleResolution {
  const roll = deterministicRoll(
    `${input.floorId}:${input.roomId}:${input.inputText}:${input.puzzleId}`
  );
  const success = roll >= 11;

  if (success) {
    return successResolution({
      input,
      title: input.puzzleId,
      summary: "The room accepts the attempt.",
      narration: [
        `The chamber answers in a way that suggests the attempt was understood.`,
      ],
      parsedIntent: { roll },
      score: roll,
    });
  }

  return failureResolution({
    input,
    title: input.puzzleId,
    summary: "The room does not accept the attempt.",
    narration: [
      `The chamber answers with resistance rather than passage.`,
    ],
    parsedIntent: { roll },
    score: roll,
  });
}

export function resolvePuzzleAttempt(input: PuzzleAttemptInput): PuzzleResolution {
  switch (input.puzzleId) {
    case "whispering_anvil":
      return resolveWhisperingAnvil(input);
    case "mirror_of_regrets":
      return resolveMirrorOfRegrets(input);
    case "pressure_gauges":
      return resolvePressureGauges(input);
    case "singing_chains":
    case "vault_of_unchosen_paths":
    case "oathbound_gate":
      return resolveGenericPuzzle(input);
    default:
      return invalidResolution(input, "Unknown puzzle.");
  }
}
