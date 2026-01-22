// ------------------------------------------------------------
// Solace Resolution Comparison
// ------------------------------------------------------------
// Run-to-Run Analysis
//
// Purpose:
// - Compare survival length and entropy
// - Surface structural differences between runs
// ------------------------------------------------------------

import type { ResolutionRun } from "./resolution.run";
import { computeMetrics } from "./resolution.metrics";

export interface RunComparison {
  runA: string;
  runB: string;
  longerRun: string | null;
  higherEntropyRun: string | null;
  summary: string[];
}

export function compareRuns(
  a: ResolutionRun,
  b: ResolutionRun
): RunComparison {
  const metricsA = computeMetrics(a.resolutions);
  const metricsB = computeMetrics(b.resolutions);

  const longerRun =
    metricsA.survivalLength ===
    metricsB.survivalLength
      ? null
      : metricsA.survivalLength >
        metricsB.survivalLength
      ? a.id
      : b.id;

  const higherEntropyRun =
    metricsA.entropyScore ===
    metricsB.entropyScore
      ? null
      : metricsA.entropyScore >
        metricsB.entropyScore
      ? a.id
      : b.id;

  const summary: string[] = [
    `Run A survived ${metricsA.survivalLength} turns.`,
    `Run B survived ${metricsB.survivalLength} turns.`,
    `Run A entropy score: ${metricsA.entropyScore}.`,
    `Run B entropy score: ${metricsB.entropyScore}.`,
  ];

  return {
    runA: a.id,
    runB: b.id,
    longerRun,
    higherEntropyRun,
    summary,
  };
}
