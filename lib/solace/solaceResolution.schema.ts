// ------------------------------------------------------------
// SolaceResolution Schema (v1)
// ------------------------------------------------------------
// Domain Contract — NOT framework-bound
//
// Purpose:
// - Define the structured resolution payload Solace emits
// - Enable rich, variable narration without mechanical authority
// - Allow renderer-controlled verbosity
//
// This schema:
// - Does NOT contain advice
// - Does NOT encode strategy
// - Does NOT change outcomes
// ------------------------------------------------------------

export const SolaceResolutionSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SolaceResolution",
  description:
    "Authoritative resolution report emitted by Solace after each intent.",
  type: "object",
  required: [
    "opening_signal",
    "situation_frame",
    "pressures",
    "process",
    "mechanical_resolution",
    "aftermath"
  ],
  properties: {
    opening_signal: {
      type: "string",
      description:
        "Single-line signal that resolution is occurring. No judgment or advice."
    },

    situation_frame: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: { type: "string" },
      description:
        "Environmental or physical conditions present at the moment of action."
    },

    pressures: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" },
      description:
        "Neutral list of pressures evaluated. May include inactive constraints."
    },

    process: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
      description:
        "Physical unfolding between intent and outcome. Primary source of color."
    },

    mechanical_resolution: {
      type: "object",
      required: ["roll", "dc", "outcome"],
      properties: {
        roll: {
          type: "integer",
          minimum: 0,
          maximum: 20,
          description: "Die roll result. 0 allowed for no-roll cases."
        },
        dc: {
          type: "integer",
          minimum: 0,
          description: "Difficulty class used for the resolution."
        },
        outcome: {
          type: "string",
          enum: ["success", "partial", "setback", "failure", "no_roll"],
          description: "Canonical outcome classification."
        }
      },
      additionalProperties: false
    },

    aftermath: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
      description:
        "Persistent world consequences and deltas. No mitigation or guidance."
    },

    closure: {
      type: ["string", "null"],
      description:
        "Optional final sentence to close the turn cleanly."
    }
  },
  additionalProperties: false
} as const;

// ------------------------------------------------------------
// TypeScript Type (Derived Contract)
// ------------------------------------------------------------

export type SolaceResolution = {
  opening_signal: string;
  situation_frame: string[];
  pressures: string[];
  process: string[];
  mechanical_resolution: {
    roll: number;
    dc: number;
    outcome: "success" | "partial" | "setback" | "failure" | "no_roll";
  };
  aftermath: string[];
  closure?: string | null;
};

// ------------------------------------------------------------
// EOF
// This file defines the canonical Solace Resolution contract.
// UI, storage, and transport layers must not reinterpret it.
// ------------------------------------------------------------
