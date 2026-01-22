// ------------------------------------------------------------
// Solace Resolution Validator
// ------------------------------------------------------------
// Purpose:
// - Enforce REQUIRED structural invariants at runtime
// - Do NOT re-decide meaning
// - Do NOT invent schema authority
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

// ------------------------------------------------------------
// Structural Validation (Runtime Safe)
// ------------------------------------------------------------

export function validateSolaceResolution(
  resolution: unknown
): resolution is SolaceResolution {
  if (
    !resolution ||
    typeof resolution !== "object"
  ) {
    return false;
  }

  const r = resolution as any;

  // Required top-level fields
  if (
    typeof r.opening_signal !== "string" ||
    !Array.isArray(r.situation_frame) ||
    !Array.isArray(r.pressures) ||
    !Array.isArray(r.process) ||
    !Array.isArray(r.aftermath)
  ) {
    return false;
  }

  // Mechanical resolution must exist
  if (
    !r.mechanical_resolution ||
    typeof r.mechanical_resolution !== "object"
  ) {
    return false;
  }

  // Legacy branch (dice-based)
  if (
    "roll" in r.mechanical_resolution ||
    "dc" in r.mechanical_resolution ||
    "outcome" in r.mechanical_resolution
  ) {
    return (
      typeof r.mechanical_resolution.roll === "number" &&
      typeof r.mechanical_resolution.dc === "number" &&
      typeof r.mechanical_resolution.outcome === "string"
    );
  }

  // Outcome branch (resource deltas)
  const m = r.mechanical_resolution;

  if (
    "foodDelta" in m ||
    "staminaDelta" in m ||
    "fireDelta" in m ||
    "appliedRecoveryCap" in m
  ) {
    return (
      (m.foodDelta === undefined ||
        typeof m.foodDelta === "number") &&
      (m.staminaDelta === undefined ||
        typeof m.staminaDelta === "number") &&
      (m.fireDelta === undefined ||
        typeof m.fireDelta === "number") &&
      (m.appliedRecoveryCap === undefined ||
        typeof m.appliedRecoveryCap === "number")
    );
  }

  // Must match one branch
  return false;
}
