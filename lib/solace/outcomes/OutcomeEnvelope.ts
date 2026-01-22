// ------------------------------------------------------------
// OutcomeEnvelope — Structural Authority
// Defines what MAY happen, never what DOES happen
// Server-only. Immutable once constructed.
// ------------------------------------------------------------

export type ResourceDeltaRange = {
  min: number;
  max: number;
};

export type ResourceDeltas = {
  food?: ResourceDeltaRange;
  stamina?: ResourceDeltaRange;
  fire?: ResourceDeltaRange;
};

export type RecoveryCaps = {
  staminaMax?: number; // soft cap due to injury
};

export type OutcomeEnvelope = {
  readonly riskProfile: "low" | "medium" | "high";
  readonly resourceDeltas: ResourceDeltas;
  readonly recoveryCaps?: RecoveryCaps;
  readonly secondaryEffectsAllowed: boolean;
};

// ------------------------------------------------------------
// Risk Signals (inferred, never declared by client)
// ------------------------------------------------------------

export type RiskSignals = {
  bodilyExposure: boolean;
  resourceCommitment: boolean;
  timeLockIn: boolean;
  environmentalVolatility: boolean;
  asymmetricStakes: boolean;
};

// ------------------------------------------------------------
// Envelope Construction (Structural Judgment Only)
// ------------------------------------------------------------

export function buildOutcomeEnvelope(input: {
  signals: RiskSignals;
  intentType: "rest" | "hunt" | "gather" | "travel" | "tend";
  context: {
    hasShelter: boolean;
    hasFire: boolean;
    injuryLevel?: "none" | "minor" | "major";
  };
}): OutcomeEnvelope {
  const signalCount = Object.values(input.signals).filter(Boolean).length;

  const riskProfile: OutcomeEnvelope["riskProfile"] =
    signalCount <= 1 ? "low" : signalCount <= 3 ? "medium" : "high";

  switch (riskProfile) {
    case "low":
      return Object.freeze({
        riskProfile,
        resourceDeltas: {
          stamina:
            input.intentType === "rest"
              ? { min: 1, max: 4 }
              : { min: 0, max: 2 },
          food:
            input.intentType === "gather"
              ? { min: 0, max: 2 }
              : undefined,
        },
        recoveryCaps: injuryCap(input.context.injuryLevel),
        secondaryEffectsAllowed: false,
      });

    case "medium":
      return Object.freeze({
        riskProfile,
        resourceDeltas: {
          stamina: { min: -1, max: 3 },
          food:
            input.intentType === "hunt"
              ? { min: -1, max: 5 }
              : undefined,
          fire:
            input.intentType === "tend"
              ? { min: 0, max: 2 }
              : undefined,
        },
        recoveryCaps: injuryCap(input.context.injuryLevel),
        secondaryEffectsAllowed: true,
      });

    case "high":
      return Object.freeze({
        riskProfile,
        resourceDeltas: {
          stamina: { min: -4, max: 5 },
          food:
            input.intentType === "hunt"
              ? { min: -3, max: 10 }
              : undefined,
          fire: { min: -2, max: 3 },
        },
        recoveryCaps: injuryCap(input.context.injuryLevel),
        secondaryEffectsAllowed: true,
      });
  }
}

// ------------------------------------------------------------
// Injury Caps — Limit Recovery, Not Current State
// ------------------------------------------------------------

function injuryCap(
  injury?: "none" | "minor" | "major"
): RecoveryCaps | undefined {
  if (!injury || injury === "none") return undefined;

  if (injury === "minor") {
    return { staminaMax: 7 };
  }

  if (injury === "major") {
    return { staminaMax: 5 };
  }

  return undefined;
}
