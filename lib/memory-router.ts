// lib/memory-router.ts
// Determines WHERE a memory is written in Supabase

export type MemoryRoute =
  | "memories"   // stable facts / identity / values
  | "notes"      // provisional, low confidence
  | "episodes"   // episodic summaries
  | "context";   // short-lived state

export function routeMemoryWrite(input: {
  finalKind: string;
  confidence: number;
  episodic?: boolean;
}): MemoryRoute {

  // Episodic always wins
  if (input.episodic) return "episodes";

  // High-confidence facts
  if (input.finalKind === "fact" && input.confidence >= 0.9) {
    return "memories";
  }

  // Identity & values are durable even at lower confidence
  if (
    input.finalKind === "identity" ||
    input.finalKind === "value"
  ) {
    return "memories";
  }

  // Contextual or short-lived
  if (input.finalKind === "context") {
    return "context";
  }

  // Everything else stays provisional
  return "notes";
}
