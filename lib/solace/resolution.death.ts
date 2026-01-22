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

function aftermathSignalsDeath(
  aftermath: string[]
): boolean {
  return aftermath.some((l) =>
    l.toLowerCase().includes("death")
  );
}

function hasDiceFailure(
  m: SolaceResolution["mechanical_resolution"]
): boolean {
  return (
    typeof (m as any).outcome === "string" &&
    (m as any).outcome === "failure"
  );
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

/**
 * A resolution is terminal if death is explicitly present.
 * Dice failure may support the interpretation, but does not
 * decide death on its own.
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
