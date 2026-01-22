// ------------------------------------------------------------
// CLIENT-SAFE RESOLUTION BUILDER
// ------------------------------------------------------------
// Purpose:
// - Build a CLIENT-ONLY resolution draft
// - Preserve felt chance (dice) for player trust
// - NEVER claim canonical authority
// ------------------------------------------------------------

// IMPORTANT:
// This file MUST NOT import SolaceResolution.
// Client code does NOT construct canon.

export type ClientResolutionDraft = {
  opening_signal: string;
  situation_frame: string[];
  pressures: string[];
  process: string[];
  aftermath: string[];

  // ----------------------------------------------------------
  // CLIENT-ONLY TELEMETRY (never canonical)
  // ----------------------------------------------------------
  draftChance?: {
    roll: number;
    dc: number;
    outcome:
      | "success"
      | "partial"
      | "setback"
      | "failure"
      | "no_roll";
  };
};

export function buildClientResolution(input: {
  legacyPayload: any;
  turn: number; // accepted but NOT embedded (ledger concern)
}): ClientResolutionDraft {
  const legacy = input.legacyPayload ?? {};

  // ----------------------------------------------------------
  // Dice (FELT CHANCE — NOT AUTHORITY)
  // ----------------------------------------------------------

  const roll =
    typeof legacy.dice?.roll === "number"
      ? legacy.dice.roll
      : 0;

  const dc =
    typeof legacy.dice?.dc === "number"
      ? legacy.dice.dc
      : 0;

  const outcome =
    legacy.dice?.mode === "none" || dc === 0
      ? "no_roll"
      : roll >= dc
      ? "success"
      : roll >= dc - 2
      ? "partial"
      : "failure";

  // ----------------------------------------------------------
  // Draft Assembly (CLIENT-SAFE)
  // ----------------------------------------------------------

  return {
    opening_signal:
      typeof legacy.description === "string"
        ? legacy.description
        : "The moment resolves.",

    situation_frame: [
      typeof legacy.description === "string"
        ? legacy.description
        : "Conditions are evaluated."
    ].slice(0, 2),

    pressures:
      Array.isArray(legacy.audit) &&
      legacy.audit.length > 0
        ? legacy.audit.slice(0, 4)
        : ["Ambient conditions"],

    process: [
      legacy.dice?.justification ??
        "Forces interact without interruption."
    ].slice(0, 3),

    aftermath: [
      "The state of the world persists."
    ].slice(0, 3),

    // CLIENT-ONLY
    draftChance: {
      roll,
      dc,
      outcome
    }
  };
}
