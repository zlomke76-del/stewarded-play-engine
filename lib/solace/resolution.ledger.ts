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

  // Explicit outcome if present (newer schema)
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
        "The tribe presses forward, but the world does not fully yield.";
      break;
    case "failure":
      opening =
        "The attempt breaks against the weight of the moment.";
      break;
    case "passage":
    default:
      opening =
        "Time moves on, indifferent to intent.";
  }

  // Situation — what was known at the time
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

  // Pressures — memory of strain
  const pressureNote =
    resolution.pressures.length > 0
      ? ` Pressure gathers: ${resolution.pressures.join(
          " "
        )}`
      : "";

  // Aftermath — lasting consequence
  const aftermath =
    resolution.aftermath.length > 0
      ? ` In the wake of this turn, ${resolution.aftermath.join(
          " "
        )}`
      : "";

  // Closure — seal the record if present
  const closure =
    typeof resolution.closure === "string"
      ? ` ${resolution.closure}`
      : "";

  return {
    turn,
    text: [
      opening,
      situation,
      process,
      pressureNote,
      aftermath,
      closure,
    ]
      .join("")
      .replace(/\s+/g, " ")
      .trim(),
  };
}
