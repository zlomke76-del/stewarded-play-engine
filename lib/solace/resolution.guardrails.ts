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
// Guardrail Checks
// ------------------------------------------------------------

export function enforceGuardrails(
  resolution: SolaceResolution
) {
  // Guardrail 1: No advisory language
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

  // Guardrail 2: No mechanics outside mechanical_resolution
  const leak =
    /\d/.test(resolution.opening_signal) ||
    resolution.situation_frame.some((l) => /\d/.test(l)) ||
    resolution.pressures.some((l) => /\d/.test(l)) ||
    resolution.process.some((l) => /\d/.test(l)) ||
    resolution.aftermath.some((l) => /\d/.test(l));

  if (leak) {
    throw new Error(
      "Guardrail violation: numeric data leaked outside mechanics section"
    );
  }

  // Guardrail 3: no_roll consistency
  if (
    resolution.mechanical_resolution.outcome ===
      "no_roll" &&
    resolution.mechanical_resolution.dc !== 0
  ) {
    throw new Error(
      "Guardrail violation: no_roll outcome with non-zero DC"
    );
  }

  // Guardrail 4: Closure must not advise
  if (
    resolution.closure &&
    forbiddenPhrases.some((p) =>
      resolution.closure!
        .toLowerCase()
        .includes(p)
    )
  ) {
    throw new Error(
      "Guardrail violation: advisory language in closure"
    );
  }
}
