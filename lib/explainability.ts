// lib/explainability.ts
// Phase 5 — Explainability Core (Authoritative)

import "server-only";

/* ============================================================
   Types
   ============================================================ */

export type ExplanationInput = {
  type:
    | "memory_promotion"
    | "memory_block"
    | "proactivity"
    | "consent"
    | "context";

  summary: string;
  details: string[];

  evidence?: {
    source: string;
    confidence?: number;
    notes?: string;
  }[];
};

export type Explanation = {
  type: ExplanationInput["type"];
  summary: string;
  details: string[];
  evidence: ExplanationInput["evidence"];
  created_at: string;
};

/* ============================================================
   Core Builder
   ============================================================ */

export function buildExplanation(
  input: ExplanationInput
): Explanation {
  return {
    type: input.type,
    summary: input.summary,
    details: input.details,
    evidence: input.evidence ?? [],
    created_at: new Date().toISOString(),
  };
}

/* ============================================================
   Memory Promotion Explainability
   ============================================================ */

export function explainMemoryPromotion(params: {
  promoted: boolean;
  finalKind: string;
  confidence: number;
  lifecycleConfidence: number;
  semanticConfidence: number;
  recentSignal: number;
}) {
  const {
    promoted,
    finalKind,
    confidence,
    lifecycleConfidence,
    semanticConfidence,
    recentSignal,
  } = params;

  return buildExplanation({
    type: "memory_promotion",
    summary: promoted
      ? "Memory promoted to fact."
      : "Memory stored without promotion.",
    details: [
      `Final kind: ${finalKind}`,
      `Overall confidence score: ${confidence.toFixed(2)}`,
      `Lifecycle stability contribution: ${lifecycleConfidence.toFixed(2)}`,
      `Semantic classification contribution: ${semanticConfidence.toFixed(2)}`,
      `Recency signal contribution: ${recentSignal.toFixed(2)}`,
      promoted
        ? "Confidence threshold met or exceeded."
        : "Confidence threshold not met.",
    ],
    evidence: [
      {
        source: "memory-intelligence",
        confidence: lifecycleConfidence,
      },
      {
        source: "memory-classifier",
        confidence: semanticConfidence,
      },
    ],
  });
}
