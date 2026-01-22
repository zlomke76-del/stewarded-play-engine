// ------------------------------------------------------------
// Solace Resolution Run
// ------------------------------------------------------------
// Single-Run Orchestration
//
// Purpose:
// - Manage a single survival run lifecycle
// - Append resolutions in order
// - Enforce terminal invariants
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import {
  isTerminalResolution,
  assertNoPostDeathTurns,
} from "./resolution.death";

export interface ResolutionRun {
  id: string;
  startedAt: number;
  endedAt?: number;
  resolutions: SolaceResolution[];
  isComplete: boolean;
}

export function createRun(): ResolutionRun {
  return {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    resolutions: [],
    isComplete: false,
  };
}

export function appendResolution(
  run: ResolutionRun,
  resolution: SolaceResolution
): ResolutionRun {
  if (run.isComplete) {
    throw new Error(
      "Cannot append resolution: run is complete"
    );
  }

  const nextResolutions = [
    ...run.resolutions,
    resolution,
  ];

  assertNoPostDeathTurns(nextResolutions);

  const terminal = isTerminalResolution(resolution);

  return {
    ...run,
    resolutions: nextResolutions,
    isComplete: terminal,
    endedAt: terminal ? Date.now() : run.endedAt,
  };
}
