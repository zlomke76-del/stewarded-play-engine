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

// ------------------------------------------------------------
// Outcome Derivation (SAFE)
// ------------------------------------------------------------

function deriveOutcome(
  resolution: SolaceResolution
): "success" | "setback" | "failure" | "no_roll" {
  const m = resolution.mechanical_resolution as any;

  // Preferred: explicit outcome
  if (typeof m.outcome === "string") {
    return m.outcome;
  }

  // Fallback: infer conservatively from mechanics
  if (
    typeof m.roll === "number" &&
    typeof m.dc === "number"
  ) {
    if (m.roll >= m.dc) return "success";
    if (m.roll >= m.dc * 0.75) return "setback";
    return "failure";
  }

  return "no_roll";
}

// ------------------------------------------------------------
// Ledger Construction
// ------------------------------------------------------------

export function buildLedgerEntry(
  resolution: SolaceResolution,
  turn: number
): LedgerEntry {
  const outcome = deriveOutcome(resolution);

  // Opening: consequence framing
  let opening: string;
  switch (outcome) {
    case "success":
      opening =
        "The tribe moves in rhythm with the land, and the moment bends in their favor.";
      break;
    case "setback":
      opening =
        "The tribe presses forward, but the world answers unevenly.";
      break;
    case "failure":
      opening =
        "Pressure overwhelms the attempt, and the cost is felt immediately.";
      break;
    case "no_roll":
      opening =
        "Time passes without confrontation. The land remains watchful.";
      break;
    default:
      opening =
        "Events unfold, shifting the balance in subtle ways.";
  }

  // Situation echo (pure restatement)
  const situation =
    resolution.situation_frame.length > 0
      ? ` ${resolution.situation_frame.join(" ")}`
      : "";

  // Process compression
  const process =
    resolution.process.length > 0
      ? ` ${resolution.process.join(" ")}`
      : "";

  // Aftermath as memory imprint
  const aftermath =
    resolution.aftermath.length > 0
      ? ` ${resolution.aftermath.join(" ")}`
      : "";

  // Closure as historical seal (optional)
  const closure =
    typeof (resolution as any).closure ===
    "string"
      ? ` ${(resolution as any).closure}`
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
