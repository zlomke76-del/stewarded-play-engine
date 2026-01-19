// lib/ethics/lifecycle.ts
// Determines whether memory should be promoted to fact or demoted.

export type LifecycleEvaluation = {
  promoteToFact: boolean;
  demote: boolean;
  confidence: number;
};

export function evaluateMemoryLifecycle(content: string): LifecycleEvaluation {
  const lower = content.toLowerCase();

  const stable =
    /(i am|i prefer|my name|i live|i believe|i always|i never)/i.test(lower);

  return {
    promoteToFact: stable,
    demote: false,
    confidence: stable ? 0.9 : 0.2,
  };
}
