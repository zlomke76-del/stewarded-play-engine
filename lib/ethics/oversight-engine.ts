// lib/ethics/oversight-engine.ts
// Final decision-maker on whether memory is allowed and how to classify it.

import { EthicalClassification } from "./classifier";
import { LifecycleEvaluation } from "./lifecycle";

export type OversightDecision = {
  allowed: boolean;
  store: boolean;
  promoteToFact: boolean;
  requiresReview: boolean;
  finalKind: string;
};

export function ethicalOversight(
  classification: EthicalClassification,
  lifecycle: LifecycleEvaluation
): OversightDecision {
  // Hard-block very sensitive material
  if (classification.sensitivity >= 5) {
    return {
      allowed: false,
      store: false,
      promoteToFact: false,
      requiresReview: true,
      finalKind: "restricted",
    };
  }

  // Promote to fact
  if (lifecycle.promoteToFact) {
    return {
      allowed: true,
      store: true,
      promoteToFact: true,
      requiresReview: classification.requiresReview,
      finalKind: "fact",
    };
  }

  // Default
  return {
    allowed: true,
    store: true,
    promoteToFact: false,
    requiresReview: classification.requiresReview,
    finalKind: classification.category,
  };
}

