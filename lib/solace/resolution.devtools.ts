// ------------------------------------------------------------
// Solace Resolution Devtools
// ------------------------------------------------------------
// Assertions + Invariant Checks
//
// Purpose:
// - Detect silent failures during development
// - Enforce non-negotiable invariants
//
// These checks MUST NOT run in production.
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

// ------------------------------------------------------------
// Invariant Assertions
// ------------------------------------------------------------

export function assertResolutionInvariants(
  resolution: SolaceResolution
) {
  // No advice keywords
  const forbidden = [
    "should",
    "try",
    "next time",
    "better",
    "worse",
    "recommend",
  ];

  const textBlob = JSON.stringify(resolution).toLowerCase();

  for (const word of forbidden) {
    if (textBlob.includes(word)) {
      throw new Error(
        `Invariant violation: advisory language detected (${word})`
      );
    }
  }

  // Numbers appear only in mechanical_resolution
  const numericLeak =
    resolution.opening_signal.match(/\d/) ||
    resolution.situation_frame.some((l) => /\d/.test(l)) ||
    resolution.pressures.some((l) => /\d/.test(l)) ||
    resolution.process.some((l) => /\d/.test(l)) ||
    resolution.aftermath.some((l) => /\d/.test(l));

  if (numericLeak) {
    throw new Error(
      "Invariant violation: numeric data leaked outside mechanics section"
    );
  }

  // Outcome sanity
  if (
    resolution.mechanical_resolution.outcome ===
      "no_roll" &&
    resolution.mechanical_resolution.dc !== 0
  ) {
    throw new Error(
      "Invariant violation: no_roll outcome with non-zero DC"
    );
  }
}

// ------------------------------------------------------------
// Dev-only Wrapper
// ------------------------------------------------------------

export function devAssert(
  resolution: SolaceResolution
) {
  if (
    process.env.NODE_ENV !== "production"
  ) {
    assertResolutionInvariants(resolution);
  }
}
