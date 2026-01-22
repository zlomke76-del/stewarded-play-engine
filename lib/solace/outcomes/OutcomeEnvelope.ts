// ------------------------------------------------------------
// OutcomeEnvelope — Canonical Resolution Bounds
// Server-only, non-deterministic
// ------------------------------------------------------------

export type ResourceDelta = {
  food?: { min: number; max: number };
  stamina?: { min: number; max: number };
  fire?: { min: number; max: number };
};

export type RecoveryCaps = {
  staminaMax?: number; // soft cap due to injury
};

export type OutcomeEnvelope = {
  riskProfile: "low" | "medium" | "high";
  resourceDeltas: ResourceDelta;
  recoveryCaps?: RecoveryCaps;
  secondaryEffectsAllowed: boolean;
};

// ------------------------------------------------------------
// Risk Signal Input (inferred, not declared)
// ------------------------------------------------------------

export type RiskSignals = {
  bodilyExposure: boolean;
  resourceCommitment: boolean;
  timeLockIn: boolean;
  environmentalVolatility: boolean;
  asymmetricStakes: boolean;
};

// ------------------------------------------------------------
// Envelope Builder (authoritative bounds only)
// ------------------------------------------------------------

export function buildOutcomeEnvelope(
  signals: RiskSignals,
  context: {
    hasShelter: boolean;
    hasFire: boolean;
    injuryLevel?: "none" | "minor" | "major";
    intentType: "rest" | "hunt" | "gather" | "travel" | "tend";
  }
): OutcomeEnvelope {
  const signalCount = Object.values(signals).filter(Boolean).length;

  let riskProfile: OutcomeEnvelope["riskProfile"] =
    signalCount <= 1 ? "low" : signalCount <= 3 ? "medium" : "high";

  // Base envelopes — these are ADMISSIBLE RANGES, not outcomes
  switch (riskProfile) {
    case "low":
      return {
        riskProfile,
        resourceDeltas: {
          stamina:
            context.intentType === "rest"
              ? { min: 1, max: 4 }
              : { min: 0, max: 2 },
          food:
            context.intentType === "gather"
              ? { min: 0, max: 2 }
              : undefined,
        },
        recoveryCaps: injuryCap(context.injuryLevel),
        secondaryEffectsAllowed: false,
      };

    case "medium":
      return {
        riskProfile,
        resourceDeltas: {
          stamina: { min: -1, max: 3 },
          food:
            context.intentType === "hunt"
              ? { min: -1, max: 5 }
              : undefined,
          fire:
            context.intentType === "tend"
              ? { min: 0, max: 2 }
              : undefined,
        },
        recoveryCaps: injuryCap(context.injuryLevel),
        secondaryEffectsAllowed: true,
      };

    case "high":
      return {
        riskProfile,
        resourceDeltas: {
          stamina: { min: -4, max: 5 },
          food:
            context.intentType === "hunt"
              ? { min: -3, max: 10 }
              : undefined,
          fire: { min: -2, max: 3 },
        },
        recoveryCaps: injuryCap(context.injuryLevel),
        secondaryEffectsAllowed: true,
      };
  }
}

// ------------------------------------------------------------
// Injury Caps — limits recovery, not current state
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
