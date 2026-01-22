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
// Outcome Inference (TYPE-SAFE)
// ------------------------------------------------------------

type InferredOutcome =
  | "success"
  | "setback"
  | "failure"
  | "passage";

function inferOutcome(
  resolution: SolaceResolution
): InferredOutcome {
  const mech = resolution.mechanical_resolution as any;

  // Explicit outcome if present
  if (typeof mech?.outcome === "string") {
    return mech.outcome as InferredOutcome;
  }

  // Roll-based inference (legacy-safe)
  if (
    typeof mech?.roll === "number" &&
    typeof mech?.dc === "number"
  ) {
    if (mech.roll >= mech.dc) return "success";
    if (mech.roll >= mech.dc - 2)
      return "setback";
    return "failure";
  }

  // No contest occurred
  return "passage";
}

// ------------------------------------------------------------
// Chronicle Builder
// ------------------------------------------------------------

export function buildLedgerEntry(
  resolution: SolaceResolution,
  turn: number
): LedgerEntry {
  const outcome = inferOutcome(resolution);

  // Opening — historical framing
  let opening: string;
  switch (outcome) {
    case "success":
      opening =
        "The tribe’s choice holds, and the land answers in kind.";
      break;
    case "setback":
      opening =
        "The tribe presses forward, but the world resists their will.";
      break;
    case "failure":
      opening =
        "The attempt breaks under strain, and its cost is felt.";
      break;
    case "passage":
    default:
      opening =
        "Time passes without contest, and the balance subtly shifts.";
  }

  // Situation — what was known
  const situation =
    resolution.situation_frame.length > 0
      ? ` ${resolution.situation_frame.join(
          " "
        )}`
      : "";

  // Process — what unfolded
  const process =
    resolution.process.length > 0
      ? ` ${resolution.process.join(" ")}`
      : "";

  // Pressure — mounting strain remembered
  const pressure =
    resolution.pressures.length > 0
      ? ` Pressure gathers as ${resolution.pressures.join(
          " "
        )}`
      : "";

  // Aftermath — lasting mark on the run
  const aftermath =
    resolution.aftermath.length > 0
      ? ` What follows is remembered: ${resolution.aftermath.join(
          " "
        )}`
      : "";

  return {
    turn,
    text: [
      opening,
      situation,
      process,
      pressure,
      aftermath,
    ]
      .join("")
      .replace(/\s+/g, " ")
      .trim(),
  };
}
