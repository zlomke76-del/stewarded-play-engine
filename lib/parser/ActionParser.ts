// ------------------------------------------------------------
// ActionParser.ts
// ------------------------------------------------------------
// Stewarded Play Engine
//
// Purpose:
// - Parse raw player input into neutral intent labels
// - NEVER decide outcomes
// - NEVER apply rules
// - NEVER modify state
//
// This module classifies attempts, nothing more.
// ------------------------------------------------------------

export type ActorId = string;

/* ------------------------------------------------------------
   Enumerations
------------------------------------------------------------ */

export type ActionCategory =
  | "movement"
  | "interaction"
  | "influence"
  | "investigation"
  | "combat"
  | "magic"
  | "environment"
  | "other";

export type AmbiguityLevel = "low" | "medium" | "high";

export type ActionIntentTag =
  | "attack"
  | "defend"
  | "skill"
  | "finisher"
  | "retreat"
  | "evade"
  | null;

/* ------------------------------------------------------------
   Parsed Action
------------------------------------------------------------ */

export interface ParsedAction {
  actor: ActorId;
  rawInput: string;

  category: ActionCategory;
  target: string | null;
  method: string | null;

  ambiguity: AmbiguityLevel;

  intentTag?: ActionIntentTag;
  skillId?: string | null;
}

/* ------------------------------------------------------------
   Parser Entry Point
------------------------------------------------------------ */

/**
 * parseAction
 *
 * Converts raw player input into a neutral classification.
 * This function MUST remain side-effect free.
 */
export function parseAction(actor: ActorId, input: string): ParsedAction {
  const normalized = input.toLowerCase().trim();

  const skillId = extractSkillId(normalized);
  const category = classifyCategory(normalized, skillId);
  const target = extractTarget(normalized);
  const method = extractMethod(normalized);
  const ambiguity = assessAmbiguity(normalized);
  const intentTag = extractIntentTag(normalized, skillId);

  return {
    actor,
    rawInput: input,
    category,
    target,
    method,
    ambiguity,
    intentTag,
    skillId,
  };
}

/* ------------------------------------------------------------
   Category Classification
------------------------------------------------------------ */

function classifyCategory(
  input: string,
  skillId: string | null
): ActionCategory {
  if (skillId) {
    if (
      isMagicSkill(skillId) ||
      containsAny(input, ["cast", "spell", "invoke", "summon"])
    ) {
      return "magic";
    }
    return "combat";
  }

  if (
    containsAny(input, [
      "attack",
      "strike",
      "hit",
      "stab",
      "shoot",
      "slash",
      "smash",
      "swing",
      "cleave",
      "finish",
      "kill",
    ])
  ) {
    return "combat";
  }

  if (
    containsAny(input, [
      "cast",
      "spell",
      "invoke",
      "summon",
      "channel",
      "hex",
      "blast",
    ])
  ) {
    return "magic";
  }

  if (containsAny(input, ["look", "search", "examine", "inspect"])) {
    return "investigation";
  }

  if (
    containsAny(input, ["talk", "ask", "convince", "persuade", "threaten"])
  ) {
    return "influence";
  }

  if (containsAny(input, ["open", "pull", "push", "use", "touch"])) {
    return "interaction";
  }

  if (
    containsAny(input, [
      "move",
      "walk",
      "run",
      "climb",
      "enter",
      "retreat",
      "withdraw",
      "disengage",
      "evade",
      "fall back",
    ])
  ) {
    return "movement";
  }

  if (containsAny(input, ["break", "burn", "flood", "collapse"])) {
    return "environment";
  }

  return "other";
}

/* ------------------------------------------------------------
   Skill Extraction
------------------------------------------------------------ */

function extractSkillId(input: string): string | null {
  const SKILL_PATTERNS: Array<[string, string[]]> = [
    ["guard_break", ["guard break"]],
    ["shield_wall", ["shield wall"]],
    ["second_wind", ["second wind"]],
    ["rage", ["rage"]],
    ["reckless_strike", ["reckless strike"]],
    ["intimidating_roar", ["intimidating roar"]],
    ["backstab", ["backstab", "back stab"]],
    ["shadowstep", ["shadowstep", "shadow step"]],
    ["disarm_trap", ["disarm trap"]],
    ["arc_bolt", ["arc bolt"]],
    ["frost_bind", ["frost bind"]],
    ["detect_arcana", ["detect arcana"]],
    ["heal", ["heal"]],
    ["bless", ["bless"]],
    ["turn_undead", ["turn undead"]],
    ["mark_target", ["mark target"]],
    ["volley", ["volley"]],
    ["track", ["track"]],
    ["smite", ["smite"]],
    ["protect", ["protect"]],
    ["rally", ["rally"]],
    ["inspire", ["inspire"]],
    ["distract", ["distract"]],
    ["soothing_verse", ["soothing verse"]],
    ["vinesnare", ["vinesnare", "vine snare"]],
    ["wild_shape", ["wild shape"]],
    ["nature_sense", ["nature sense"]],
    ["flurry", ["flurry"]],
    ["deflect", ["deflect"]],
    ["center_self", ["center self"]],
    ["gadget_trap", ["gadget trap"]],
    ["infuse_weapon", ["infuse weapon"]],
    ["deploy_device", ["deploy device"]],
    ["chaos_bolt", ["chaos bolt"]],
    ["surge", ["surge"]],
    ["quickened_cast", ["quickened cast"]],
    ["hex", ["hex"]],
    ["eldritch_blast", ["eldritch blast"]],
    ["pact_ward", ["pact ward"]],
  ];

  for (const [skillId, patterns] of SKILL_PATTERNS) {
    if (patterns.some((pattern) => input.includes(pattern))) {
      return skillId;
    }
  }

  return null;
}

function isMagicSkill(skillId: string) {
  return [
    "arc_bolt",
    "frost_bind",
    "detect_arcana",
    "heal",
    "bless",
    "turn_undead",
    "vinesnare",
    "wild_shape",
    "nature_sense",
    "infuse_weapon",
    "deploy_device",
    "chaos_bolt",
    "surge",
    "quickened_cast",
    "hex",
    "eldritch_blast",
    "pact_ward",
  ].includes(skillId);
}

/* ------------------------------------------------------------
   Intent Extraction
------------------------------------------------------------ */

function extractIntentTag(
  input: string,
  skillId: string | null
): ActionIntentTag {
  if (
    containsAny(input, [
      "retreat",
      "withdraw",
      "fall back",
      "run away",
      "escape",
    ])
  ) {
    return "retreat";
  }

  if (containsAny(input, ["evade", "disengage", "slip away"])) {
    return "evade";
  }

  if (
    containsAny(input, [
      "guard",
      "defend",
      "brace",
      "hold the line",
      "protect",
      "shield wall",
    ])
  ) {
    return "defend";
  }

  if (
    containsAny(input, [
      "finish",
      "end this",
      "end the fight",
      "final strike",
      "decisive blow",
      "kill",
    ])
  ) {
    return "finisher";
  }

  if (skillId) {
    return "skill";
  }

  if (
    containsAny(input, [
      "attack",
      "strike",
      "hit",
      "stab",
      "shoot",
      "slash",
      "smash",
      "swing",
      "cleave",
    ])
  ) {
    return "attack";
  }

  return null;
}

/* ------------------------------------------------------------
   Target Extraction (Best-Effort, Optional)
------------------------------------------------------------ */

function extractTarget(input: string): string | null {
  const prepositions = ["at", "to", "on", "with", "into", "against"];

  for (const prep of prepositions) {
    const idx = input.indexOf(` ${prep} `);
    if (idx !== -1) {
      return input.slice(idx + prep.length + 2).trim();
    }
  }

  return null;
}

/* ------------------------------------------------------------
   Method Extraction (Optional)
------------------------------------------------------------ */

function extractMethod(input: string): string | null {
  if (containsAny(input, ["quietly", "slowly", "carefully"])) {
    return "careful";
  }

  if (containsAny(input, ["quickly", "suddenly", "rush"])) {
    return "fast";
  }

  if (containsAny(input, ["loudly", "shout", "yell"])) {
    return "loud";
  }

  return null;
}

/* ------------------------------------------------------------
   Ambiguity Assessment
------------------------------------------------------------ */

function assessAmbiguity(input: string): AmbiguityLevel {
  if (containsAny(input, ["maybe", "try", "kind of", "see if"])) {
    return "high";
  }

  if (input.length < 10) {
    return "medium";
  }

  return "low";
}

/* ------------------------------------------------------------
   Utilities
------------------------------------------------------------ */

function containsAny(input: string, words: string[]): boolean {
  return words.some((w) => input.includes(w));
}

/* ------------------------------------------------------------
   HARD BANS (By Design)
------------------------------------------------------------ */
// This module MUST NOT:
// - roll dice
// - calculate success
// - apply modifiers
// - infer intent beyond classification
// - mutate SessionState
//
// If you feel tempted to add logic here,
// you are collapsing parsing and authority.
// ------------------------------------------------------------
