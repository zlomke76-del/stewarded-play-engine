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

export type AmbiguityLevel =
  | "low"
  | "medium"
  | "high";

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
export function parseAction(
  actor: ActorId,
  input: string
): ParsedAction {
  const normalized = input.toLowerCase().trim();

  const category = classifyCategory(normalized);
  const target = extractTarget(normalized);
  const method = extractMethod(normalized);
  const ambiguity = assessAmbiguity(normalized);

  return {
    actor,
    rawInput: input,
    category,
    target,
    method,
    ambiguity,
  };
}

/* ------------------------------------------------------------
   Category Classification
------------------------------------------------------------ */

function classifyCategory(input: string): ActionCategory {
  if (containsAny(input, ["attack", "strike", "hit", "stab", "shoot"])) {
    return "combat";
  }

  if (containsAny(input, ["cast", "spell", "invoke", "summon"])) {
    return "magic";
  }

  if (containsAny(input, ["look", "search", "examine", "inspect"])) {
    return "investigation";
  }

  if (containsAny(input, ["talk", "ask", "convince", "persuade", "threaten"])) {
    return "influence";
  }

  if (containsAny(input, ["open", "pull", "push", "use", "touch"])) {
    return "interaction";
  }

  if (containsAny(input, ["move", "walk", "run", "climb", "enter"])) {
    return "movement";
  }

  if (containsAny(input, ["break", "burn", "flood", "collapse"])) {
    return "environment";
  }

  return "other";
}

/* ------------------------------------------------------------
   Target Extraction (Best-Effort, Optional)
------------------------------------------------------------ */

function extractTarget(input: string): string | null {
  const prepositions = ["at", "to", "on", "with", "into"];

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
