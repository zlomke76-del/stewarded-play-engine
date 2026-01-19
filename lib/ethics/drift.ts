// lib/ethics/drift.ts
// Detects contradiction between new memory and existing memory.

export type DriftResult = {
  driftDetected: boolean;
  conflictLevel: number; // 0–3
};

export function detectDrift(newContent: string, oldContent: string): DriftResult {
  const A = newContent.toLowerCase();
  const B = oldContent.toLowerCase();

  const contradicts =
    (A.includes("yes") && B.includes("no")) ||
    (A.includes("no") && B.includes("yes")) ||
    (A.includes("always") && B.includes("never")) ||
    (A.includes("never") && B.includes("always"));

  return {
    driftDetected: contradicts,
    conflictLevel: contradicts ? 3 : 0,
  };
}
