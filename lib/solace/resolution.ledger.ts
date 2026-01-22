// ------------------------------------------------------------
// Solace World Ledger Chronicle
// ------------------------------------------------------------
// Purpose:
// - Convert canonical resolutions into living history
// - Preserve causality and memory without mutating state
// - NEVER introduce new facts or mechanics
//
// The ledger does not summarize.
// It remembers.
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export interface LedgerEntry {
  turn: number;
  text: string;
}

// ------------------------------------------------------------
// Outcome Derivation (Schema-Safe)
// ------------------------------------------------------------
// MechanicalResolution is intentionally polymorphic.
// We derive outcome conservatively without assuming shape.
// ------------------------------------------------------------

type ResolutionOutcome =
  | "success"
  | "setback"
  | "failure"
  | "no_roll"
  | "unknown";

function deriveOutcome(
  resolution: SolaceResolution
): ResolutionOutcome {
  const mr: any = resolution.mechanical_resolution;

  if (!mr || typeof mr !== "object") {
    return "unknown";
  }

  if (typeof mr.outcome === "string") {
    return mr.outcome;
  }

  if (mr.type === "no_roll") {
    return "no_roll";
  }

  return "unknown";
}

// ------------------------------------------------------------
// Chronicle Builder
// ------------------------------------------------------------

export function buildLedgerEntry(
  resolution: SolaceResolution,
  turn: number
): LedgerEntry {
  const outcome = deriveOutcome(resolution);

  // ----------------------------------------------------------
  // Opening — the world’s response, not the tribe’s intent
  // ----------------------------------------------------------

  let opening: string;
  switch (outcome) {
    case "success":
      opening =
        "The moment holds. The world gives just enough.";
      break;
    case "setback":
      opening =
        "Effort meets resistance. The land does not fully yield.";
      break;
    case "failure":
      opening =
        "Pressure overwhelms the attempt. Cost is taken.";
      break;
    case "no_roll":
      opening =
        "Nothing contests the turn. Time advances all the same.";
      break;
    default:
      opening =
        "Events settle without clear signal, but balance shifts.";
  }

  // ----------------------------------------------------------
  // Situation — echoed perception only (no new facts)
  // ----------------------------------------------------------

  const situation =
    resolution.situation_frame &&
    resolution.situation_frame.length > 0
      ? ` ${resolution.situation_frame.join(" ")}`
      : "";

  // ----------------------------------------------------------
  // Process — compressed motion, not narration
  // ----------------------------------------------------------

  const process =
    resolution.process && resolution.process.length > 0
      ? ` ${resolution.process.join(" ")}`
      : "";

  // ----------------------------------------------------------
  // Aftermath — consequences that persist
  // ----------------------------------------------------------

  const aftermath =
    resolution.aftermath && resolution.aftermath.length > 0
      ? ` ${resolution.aftermath.join(" ")}`
      : "";

  // ----------------------------------------------------------
  // Memory Seal — forward pressure without new facts
  // ----------------------------------------------------------

  let memorySeal: string;
  switch (outcome) {
    case "success":
      memorySeal =
        " The balance tips forward. This moment will be carried.";
      break;
    case "setback":
      memorySeal =
        " The strain lingers. The cost is not yet done.";
      break;
    case "failure":
      memorySeal =
        " Weakness is exposed. The land will remember.";
      break;
    case "no_roll":
      memorySeal =
        " Nothing changes — which itself tightens the weave.";
      break;
    default:
      memorySeal =
        " The weave tightens in quiet ways.";
  }

  // ----------------------------------------------------------
  // Assembly — single breath, carved memory
  // ----------------------------------------------------------

  const text = [
    opening,
    situation,
    process,
    aftermath,
    memorySeal,
  ]
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  return {
    turn,
    text,
  };
}
