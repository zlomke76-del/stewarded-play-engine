// lib/hybrid/optimist.ts
import "server-only";

export async function runOptimist({
  evidence,
  userQuery,
}: {
  evidence: any[];
  userQuery: string;
}) {
  return {
    stance: "optimist",
    summary:
      "Based on available memory, here is the most coherent current state.",
    supportingEvidence: evidence.slice(0, 3),
  };
}
