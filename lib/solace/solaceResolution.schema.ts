// ------------------------------------------------------------
// SolaceResolution Schema (AUTHORITATIVE)
// ------------------------------------------------------------
// Canonical, append-only resolution record
// ------------------------------------------------------------

export type LegacyMechanicalResolution = {
  roll: number;
  dc: number;
  outcome:
    | "success"
    | "partial"
    | "setback"
    | "failure"
    | "no_roll";
};

export type OutcomeMechanicalResolution = {
  foodDelta?: number;
  staminaDelta?: number;
  fireDelta?: number;
  appliedRecoveryCap?: number;
};

export type MechanicalResolution =
  | LegacyMechanicalResolution
  | OutcomeMechanicalResolution;

export type SolaceResolution = {
  opening_signal: string;

  situation_frame: string[];
  pressures: string[];
  process: string[];

  mechanical_resolution: MechanicalResolution;

  aftermath: string[];
};
