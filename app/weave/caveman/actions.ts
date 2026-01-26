// ------------------------------------------------------------
// Caveman Server Actions (AUTHORITATIVE)
// ------------------------------------------------------------
// Purpose:
// - Client submits legacy payload + structural context
// - Server produces canonical SolaceResolution (strict schema)
// - Server persists ResolutionRun (durable canon)
// ------------------------------------------------------------

"use server";

import type { SolaceResolution } from "@/lib/solace/solaceResolution.schema";
import type { ResolutionRun } from "@/lib/solace/resolution.run";

import { buildSolaceResolution } from "@/lib/solace/resolution.pipeline";
import { saveRun } from "@/lib/solace/resolution.persistence";

// ------------------------------------------------------------
// Option Kinds
// ------------------------------------------------------------

type OptionKind =
  | "safe"
  | "environmental"
  | "risky"
  | "contested";

// ------------------------------------------------------------
// Tiny Resource Delta Schema (OPTIONAL)
// ------------------------------------------------------------

type ResourceDelta = {
  foodDelta?: number;
  staminaDelta?: number;
  fireDelta?: number;
};

// ------------------------------------------------------------
// Intent inference (STRUCTURAL)
// ------------------------------------------------------------

function optionKindToIntentType(
  kind: OptionKind
): "rest" | "hunt" | "gather" | "travel" | "tend" {
  switch (kind) {
    case "safe":
      return "rest";
    case "environmental":
      return "travel";
    case "risky":
      return "gather";
    case "contested":
      return "hunt";
    default:
      return "gather";
  }
}

// ------------------------------------------------------------
// Risk signals (STRUCTURAL — AUTHORITATIVE)
// ------------------------------------------------------------

function optionKindToRiskSignals(kind: OptionKind) {
  switch (kind) {
    case "safe":
      return {
        bodilyExposure: false,
        resourceCommitment: false,
        timeLockIn: false,
        environmentalVolatility: false,
        asymmetricStakes: false,
      };
    case "environmental":
      return {
        bodilyExposure: false,
        resourceCommitment: true,
        timeLockIn: true,
        environmentalVolatility: true,
        asymmetricStakes: false,
      };
    case "risky":
      return {
        bodilyExposure: true,
        resourceCommitment: false,
        timeLockIn: false,
        environmentalVolatility: false,
        asymmetricStakes: true,
      };
    case "contested":
      return {
        bodilyExposure: true,
        resourceCommitment: true,
        timeLockIn: true,
        environmentalVolatility: true,
        asymmetricStakes: true,
      };
    default:
      return {
        bodilyExposure: false,
        resourceCommitment: false,
        timeLockIn: false,
        environmentalVolatility: false,
        asymmetricStakes: false,
      };
  }
}

// ------------------------------------------------------------
// Resource Delta Derivation (AUTHORITATIVE)
// ------------------------------------------------------------

function deriveResourceDelta(params: {
  intentType: "rest" | "hunt" | "gather" | "travel" | "tend";
  success: boolean;
  context: {
    hasShelter: boolean;
    hasFire: boolean;
  };
}): ResourceDelta | undefined {
  const { intentType, success, context } = params;

  if (!success) return undefined;

  switch (intentType) {
    case "hunt":
      return {
        foodDelta: 1 + (context.hasFire ? 1 : 0),
        staminaDelta: -1,
      };

    case "gather":
      return {
        foodDelta: 1,
        staminaDelta: -1,
      };

    case "rest":
      return {
        staminaDelta: context.hasShelter ? 2 : 1,
        fireDelta: context.hasFire ? 0 : -1,
      };

    case "tend":
      return {
        fireDelta: 1,
        staminaDelta: -1,
      };

    case "travel":
      return {
        staminaDelta: -1,
        fireDelta: context.hasFire ? -1 : 0,
      };

    default:
      return undefined;
  }
}

// ------------------------------------------------------------
// Canonical Resolution Entry Point
// ------------------------------------------------------------

export async function runSolaceResolutionOnServer(input: {
  legacyPayload: any;
  turn: number;
  optionKind: OptionKind;

  context: {
    food: number;
    stamina: number;
    fire: number;
    hasShelter: boolean;
    hasFire: boolean;
    injuryLevel?: "none" | "minor" | "major";
  };
}): Promise<SolaceResolution> {
  const intentType = optionKindToIntentType(
    input.optionKind
  );

  const riskSignals = optionKindToRiskSignals(
    input.optionKind
  );

  const success =
    typeof input.legacyPayload?.dice?.roll === "number" &&
    input.legacyPayload.dice.roll >=
      input.legacyPayload.dice.dc;

  const resourceDelta = deriveResourceDelta({
    intentType,
    success,
    context: {
      hasShelter: input.context.hasShelter,
      hasFire: input.context.hasFire,
    },
  });

  // 🔒 Canon-safe injection (no schema break)
  const enrichedPayload = {
    ...input.legacyPayload,
    mechanical_resolution: {
      ...(input.legacyPayload?.mechanical_resolution ?? {}),
      ...resourceDelta,
    },
  };

  return buildSolaceResolution({
    legacyPayload: enrichedPayload,
    turn: input.turn,
    riskSignals,
    intentType,
    context: input.context,
  });
}

// ------------------------------------------------------------
// Durable Persistence
// ------------------------------------------------------------

export async function persistRunOnServer(
  run: ResolutionRun
): Promise<void> {
  await saveRun(run);
}
