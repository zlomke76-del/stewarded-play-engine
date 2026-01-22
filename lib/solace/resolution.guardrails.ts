// ------------------------------------------------------------
// Solace Resolution Guardrails
// ------------------------------------------------------------
// Runtime Safety Boundaries
//
// Purpose:
// - Enforce non-negotiable safety and integrity constraints
// - Prevent silent drift or escalation
// - Fail fast on invariant violations
//
// These guardrails are runtime-enforced.
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function hasDiceMechanics(
  m: SolaceResolution["mechanical_resolution"]
): m is {
  roll: number;
  dc: number;
  outcome:
    | "success"
    | "partial"
    | "setback"
    | "failure"
    | "no_roll";
} {
  return (
    typeof (m as any).roll === "number" &&
    typeof (m as any).dc === "number" &&
    typeof (m as any).outcome === "string"
  );
}

// ------------------------------------------------------------
// Guardrail Checks
// ------------------------------------------------------------

export function enforceGuardrails(
  resolution: SolaceResolution
) {
  // ----------------------------------------------------------
  // Guardrail 1: No advisory language
  // ----------------------------------------------------------
  const forbiddenPhrases = [
    "should",
    "try",
    "consider",
    "next time",
    "recommend",
    "better",
    "worse",
  ];

  const text = JSON.stringify(resolution).toLowerCase();

  for (const phrase of forbiddenPhrases) {
    if (text.includes(phrase)) {
      throw new Error(
        `Guardrail violation: advisory language detected ("${phrase}")`
      );
    }
  }

  // ----------------------------------------------------------
  // Guardrail 2: No mechanics outside mechanical_resolution
  // ----------------------------------------------------------
  const leak =
    /\d/.test(resolution.opening_signal) ||
    resolution.situation_frame.some((l) =>
      /\d/.test(l)
    ) ||
    resolution.pressures.some((l) =>
      /\d/.test(l)
    ) ||
    resolution.process.some((l) =>
      /\d/.test(l)
    ) ||
    resolution.aftermath.some((l) =>
      /\d/.test(l)
    );

  if (leak) {
    throw new Error(
      "Guardrail violation: numeric data leaked outside mechanics section"
    );
  }

  // ----------------------------------------------------------
  // Guardrail 3: Dice consistency (legacy only)
  // ----------------------------------------------------------
  const m = resolution.mechanical_resolution;

  if (hasDiceMechanics(m)) {
    if (
      m.outcome === "no_roll" &&
      m.dc !== 0
    ) {
      throw new Error(
        "Guardrail violation: no_roll outcome with non-zero DC"
      );
    }
  }

  // ----------------------------------------------------------
  // Guardrail 4: No closure (schema invariant)
  // ----------------------------------------------------------
  // closure is intentionally not part of SolaceResolution.
  // Its presence anywhere is a hard violation.
  if (
    "closure" in (resolution as any)
  ) {
    throw new Error(
      "Guardrail violation: deprecated field 'closure' detected"
    );
  }
}
