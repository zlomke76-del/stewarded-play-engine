// ------------------------------------------------------------
// Resolution Death Invariants
// ------------------------------------------------------------
// Purpose:
// - Detect terminal resolutions
// - Enforce no turns after death
// - Death is narrative-authoritative, not mechanical
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/**
 * Narrative death detection.
 * Death must be explicit in aftermath text.
 */
function aftermathSignalsDeath(
  aftermath: string[]
): boolean {
  return aftermath.some((l) =>
    l.toLowerCase().includes("death")
  );
}

/**
 * Legacy mechanical support signal ONLY.
 * This must never assume dice exist.
 * Outcome may exist without roll/DC.
 */
function hasDiceFailure(
  m: SolaceResolution["mechanical_resolution"]
): boolean {
  if (
    typeof m !== "object" ||
    m === null ||
    !("outcome" in m)
  ) {
    return false;
  }

  return (m as any).outcome === "failure";
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

/**
 * A resolution is terminal if death is explicitly present.
 *
 * Narrative authority is primary.
 * Mechanical failure may SUPPORT interpretation,
 * but can never decide death on its own.
 */
export function isTerminalResolution(
  resolution: SolaceResolution
): boolean {
  // Narrative authority first
  if (aftermathSignalsDeath(resolution.aftermath)) {
    return true;
  }

  // Optional legacy support signal
  if (
    hasDiceFailure(resolution.mechanical_resolution) &&
    resolution.aftermath.length > 0
  ) {
    return true;
  }

  return false;
}

/**
 * Enforce that no resolutions occur after death.
 * Canon must halt cleanly once death is recorded.
 */
export function assertNoPostDeathTurns(
  resolutions: SolaceResolution[]
): void {
  let deathIndex = -1;

  for (let i = 0; i < resolutions.length; i++) {
    if (isTerminalResolution(resolutions[i])) {
      deathIndex = i;
      break;
    }
  }

  if (
    deathIndex !== -1 &&
    deathIndex < resolutions.length - 1
  ) {
    throw new Error(
      "Invariant violation: resolutions appended after death"
    );
  }
}
