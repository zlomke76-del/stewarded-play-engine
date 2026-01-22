// ------------------------------------------------------------
// SolaceResolution Schema (AUTHORITATIVE)
// ------------------------------------------------------------
// Canonical, append-only resolution record
// ------------------------------------------------------------

// Legacy mechanical outcomes.
// NOTE:
// - roll and dc are nullable by design
// - narrative-only and no_roll turns are valid historical states
// - authority over meaning remains downstream (envelope)
export type LegacyMechanicalResolution = {
  roll: number | null;
  dc: number | null;
  outcome:
    | "success"
    | "partial"
    | "setback"
    | "failure"
    | "no_roll";
};

// Outcome deltas applied to world state.
// NOTE:
// - These are derived effects, not rolls
// - Presence does not imply mechanical authority
export type OutcomeMechanicalResolution = {
  foodDelta?: number;
  staminaDelta?: number;
  fireDelta?: number;
  appliedRecoveryCap?: number;
};

// MechanicalResolution is intentionally a union:
// - Legacy mechanics (possibly no_roll)
// - Outcome-only deltas
// Absence of rolls is a valid, representable state
export type MechanicalResolution =
  | LegacyMechanicalResolution
  | OutcomeMechanicalResolution;

// ------------------------------------------------------------
// SolaceResolution (Canonical Ledger Entry)
// ------------------------------------------------------------

export type SolaceResolution = {
  opening_signal: string;

  situation_frame: string[];
  pressures: string[];
  process: string[];

  mechanical_resolution: MechanicalResolution;

  aftermath: string[];
};
