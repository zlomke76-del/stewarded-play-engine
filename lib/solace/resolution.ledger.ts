// ------------------------------------------------------------
// Solace World Ledger Chronicle
// ------------------------------------------------------------
// Purpose:
// - Record remembered history, not events or mechanics
// - Collapse intent + resolution into living narrative memory
// - Preserve continuity across turns
//
// HARD CONSTRAINTS:
// - NO new facts
// - NO new actors
// - NO new state
// - Uses ONLY SolaceResolution fields
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export interface LedgerEntry {
  turn: number;
  text: string;
}

// ------------------------------------------------------------
// Tone Inference (schema-safe)
// ------------------------------------------------------------

type ChronicleTone =
  | "advance"
  | "resistance"
  | "collapse"
  | "passage";

function inferTone(
  resolution: SolaceResolution
): ChronicleTone {
  const mech: any = resolution.mechanical_resolution;

  if (
    typeof mech?.roll === "number" &&
    typeof mech?.dc === "number"
  ) {
    if (mech.roll >= mech.dc) return "advance";
    if (mech.roll >= mech.dc - 2)
      return "resistance";
    return "collapse";
  }

  return "passage";
}

// ------------------------------------------------------------
// Chronicle Builder
// ------------------------------------------------------------

export function buildLedgerEntry(
  resolution: SolaceResolution,
  turn: number
): LedgerEntry {
  const tone = inferTone(resolution);

  // ---- SUBJECT (WHO ACTED) ----
  // We treat opening_signal as Solace’s canonical understanding
  // of the player’s declared intent — NOT raw player text.
  const actor =
    resolution.opening_signal?.trim() ||
    "The tribe acts";

  // ---- WORLD RESPONSE (HOW IT MET THEM) ----
  let worldResponse: string;
  switch (tone) {
    case "advance":
      worldResponse =
        "The land yields enough for their effort to take hold.";
      break;
    case "resistance":
      worldResponse =
        "The land resists, slowing progress and taxing resolve.";
      break;
    case "collapse":
      worldResponse =
        "The land does not give. What was attempted fails to endure.";
      break;
    case "passage":
    default:
      worldResponse =
        "Nothing intervenes, yet time presses forward all the same.";
  }

  // ---- CONTEXTUAL MEMORY ----
  // Situation is remembered, not restated
  const situation =
    resolution.situation_frame.length > 0
      ? ` At the time, ${resolution.situation_frame.join(
          " "
        )}`
      : "";

  // ---- ACTION FLOW (INTENT RESOLVED INTO HISTORY) ----
  // This is where intent becomes story
  const actionFlow =
    resolution.process.length > 0
      ? ` Their actions unfold as follows: ${resolution.process.join(
          " "
        )}`
      : "";

  // ---- PRESSURE AS CONTINUING FORCE ----
  const pressure =
    resolution.pressures.length > 0
      ? ` Even as this concludes, the world applies pressure: ${resolution.pressures.join(
          " "
        )}`
      : "";

  // ---- CONSEQUENCE MEMORY ----
  // What the tribe carries into the next turn
  const consequence =
    resolution.aftermath.length > 0
      ? ` What remains after is this: ${resolution.aftermath.join(
          " "
        )}`
      : "";

  // ---- TURN ANCHOR ----
  const turnAnchor = `Turn ${turn}.`;

  return {
    turn,
    text: [
      turnAnchor,
      actor + ".",
      worldResponse,
      situation,
      actionFlow,
      pressure,
      consequence,
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
  };
}
