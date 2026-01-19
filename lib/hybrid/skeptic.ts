// lib/hybrid/skeptic.ts
import "server-only";

export async function runSkeptic({
  evidence,
  userQuery,
}: {
  evidence: any[];
  userQuery: string;
}) {
  return {
    stance: "skeptic",
    concerns: [
      "Memory may be incomplete.",
      "Some assumptions rely on recency bias.",
    ],
    weakEvidence: evidence.filter((e) => e.confidence < 0.7),
  };
}
