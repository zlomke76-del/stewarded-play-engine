// ------------------------------------------------------------
// Solace World Ledger Chronicle
// ------------------------------------------------------------
// Purpose:
// - Convert canonical resolutions into living history
// - Add texture, causality, and memory
// - NEVER introduce new facts or state
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export interface LedgerEntry {
  turn: number;
  text: string;
}

export function buildLedgerEntry(
  resolution: SolaceResolution,
  turn: number
): LedgerEntry {
  const { outcome } = resolution.mechanical_resolution;

  // Opening: consequence framing
  let opening: string;
  switch (outcome) {
    case "success":
      opening =
        "The tribe acts with intent, and the world yields.";
      break;
    case "setback":
      opening =
        "Effort meets resistance. The land does not fully give.";
      break;
    case "failure":
      opening =
        "The attempt collapses under pressure. Cost is paid.";
      break;
    case "no_roll":
      opening =
        "Time passes without contest. The world watches.";
      break;
    default:
      opening =
        "Events unfold, and the balance shifts.";
  }

  // Situation echo (no new facts)
  const situation =
    resolution.situation_frame.length > 0
      ? ` ${resolution.situation_frame.join(" ")}`
      : "";

  // Process compression
  const process =
    resolution.process.length > 0
      ? ` ${resolution.process.join(" ")}`
      : "";

  // Aftermath as consequence memory
  const aftermath =
    resolution.aftermath.length > 0
      ? ` ${resolution.aftermath.join(" ")}`
      : "";

  // Closure (if present) as historical seal
  const closure = resolution.closure
    ? ` ${resolution.closure}`
    : "";

  return {
    turn,
    text: [
      opening,
      situation,
      process,
      aftermath,
      closure,
    ]
      .join("")
      .replace(/\s+/g, " ")
      .trim(),
  };
}
