// ------------------------------------------------------------
// OptionGenerator.ts
// ------------------------------------------------------------
// Stewarded Play Engine
//
// Purpose:
// - Generate bounded, non-ranked options
// - Surface possibility, not advice
// - Preserve human authority over choice
//
// This module MUST remain non-evaluative.
// ------------------------------------------------------------

import { ParsedAction } from "@/lib/parser/ActionParser";

/* ------------------------------------------------------------
   Option Types
------------------------------------------------------------ */

export type OptionCategory =
  | "mechanical"
  | "narrative"
  | "environmental"
  | "social"
  | "other";

/**
 * An Option represents a viable path forward.
 * It does NOT include probabilities, outcomes, or recommendations.
 */
export interface Option {
  id: string;
  category: OptionCategory;
  description: string;
}

/**
 * OptionSet is a flat collection of possibilities.
 * Ordering is not meaningful.
 */
export interface OptionSet {
  context: string;
  options: readonly Option[];
}

/* ------------------------------------------------------------
   Generator Entry Point
------------------------------------------------------------ */

/**
 * generateOptions
 *
 * Produces a bounded set of plausible options
 * based on the parsed action.
 *
 * This function MUST NOT:
 * - rank options
 * - filter options by likelihood
 * - assign moral weight
 */
export function generateOptions(
  parsed: ParsedAction
): OptionSet {
  const options: Option[] = [];

  switch (parsed.category) {
    case "combat":
      options.push(
        option("mechanical", "Resolve as an attack or hostile action"),
        option("environmental", "Account for terrain or surroundings"),
        option("narrative", "Interrupt or escalate the confrontation")
      );
      break;

    case "magic":
      options.push(
        option("mechanical", "Treat as a spell or magical effect"),
        option("narrative", "Interpret as a ritual or symbolic act"),
        option("environmental", "Allow magic to affect the environment")
      );
      break;

    case "influence":
      options.push(
        option("social", "Call for a social or influence check"),
        option("narrative", "Allow roleplay to resolve the moment"),
        option("mechanical", "Apply consequences without a roll")
      );
      break;

    case "investigation":
      options.push(
        option("mechanical", "Request an investigation or perception check"),
        option("narrative", "Reveal partial or ambiguous information"),
        option("environmental", "Change scene context based on findings")
      );
      break;

    case "movement":
      options.push(
        option("mechanical", "Resolve movement with obstacles or costs"),
        option("environmental", "Trigger environmental reactions"),
        option("narrative", "Advance the scene without mechanics")
      );
      break;

    case "interaction":
      options.push(
        option("mechanical", "Resolve via a simple interaction rule"),
        option("narrative", "Allow freeform interaction"),
        option("environmental", "Alter an object or location state")
      );
      break;

    case "environment":
      options.push(
        option("environmental", "Apply environmental consequences"),
        option("mechanical", "Resolve via strength or tool use"),
        option("narrative", "Escalate or diffuse the situation")
      );
      break;

    default:
      options.push(
        option("narrative", "Clarify intent through roleplay"),
        option("mechanical", "Request clarification or a roll"),
        option("other", "Defer resolution")
      );
      break;
  }

  return {
    context: buildContext(parsed),
    options,
  };
}

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

function option(
  category: OptionCategory,
  description: string
): Option {
  return {
    id: crypto.randomUUID(),
    category,
    description,
  };
}

function buildContext(parsed: ParsedAction): string {
  return [
    `Actor: ${parsed.actor}`,
    `Category: ${parsed.category}`,
    parsed.target ? `Target: ${parsed.target}` : null,
    parsed.method ? `Method: ${parsed.method}` : null,
    `Ambiguity: ${parsed.ambiguity}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/* ------------------------------------------------------------
   HARD BANS (By Design)
------------------------------------------------------------ */
// This module MUST NOT:
// - score options
// - recommend options
// - hide options
// - collapse options into a single path
// - infer success or failure
//
// If an option ever sounds like advice,
// the design has failed.
// ------------------------------------------------------------
