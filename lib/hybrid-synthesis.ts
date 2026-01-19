import "server-only";
import { runOptimist } from "./hybrid/optimist";
import { runSkeptic } from "./hybrid/skeptic";
import { runArbiter } from "./hybrid/arbiter";
import type { MemoryEvidence } from "./memory-evidence";

export async function synthesizeFromMemory(params: {
  evidence: MemoryEvidence[];
  userQuery: string;
}) {
  const optimist = await runOptimist(params);
  const skeptic = await runSkeptic(params);

  const arbiter = await runArbiter({
    userQuery: params.userQuery,
    optimist,
    skeptic,
    evidence: params.evidence,
  });

  return {
    perspectives: { optimist, skeptic },
    conclusion: arbiter,
  };
}
