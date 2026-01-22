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

type OptionKind =
  | "safe"
  | "environmental"
  | "risky"
  | "contested";

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

function optionKindToRiskSignals(kind: OptionKind) {
  // Structural inference — server authoritative
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

export async function runSolaceResolutionOnServer(input: {
  legacyPayload: any;
  turn: number;
  optionKind: OptionKind;

  // current pressures (best available; can be refined later)
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

  // Canonical, strict, server-authoritative build
  return buildSolaceResolution({
    legacyPayload: input.legacyPayload,
    turn: input.turn,
    riskSignals,
    intentType,
    context: input.context,
  });
}

export async function persistRunOnServer(
  run: ResolutionRun
): Promise<void> {
  // Durable append-only persistence
  await saveRun(run);
}
