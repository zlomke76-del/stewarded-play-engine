// ------------------------------------------------------------
// Solace Resolution Run
// ------------------------------------------------------------
// Single-Run Orchestration
//
// Purpose:
// - Manage a single survival run lifecycle
// - Append resolutions in order
// - Enforce terminal invariants
// - Maintain a living World Ledger
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import type { LedgerEntry } from "./resolution.ledger";
import {
  isTerminalResolution,
  assertNoPostDeathTurns,
} from "./resolution.death";

// ------------------------------------------------------------
// Run Shape (AUTHORITATIVE)
// ------------------------------------------------------------

export interface ResolutionRun {
  id: string;
  startedAt: number;
  endedAt?: number;

  // Canon (append-only, ordered)
  resolutions: SolaceResolution[];

  // Memory (sealed at persistence boundary)
  ledger: LedgerEntry[];

  // Terminal state (single source of truth)
  isComplete: boolean;
}

// ------------------------------------------------------------
// Run Creation
// ------------------------------------------------------------

export function createRun(): ResolutionRun {
  return {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    resolutions: [],
    ledger: [],
    isComplete: false,
  };
}

// ------------------------------------------------------------
// Canon Append
// ------------------------------------------------------------

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

  // Enforce death invariants BEFORE commit
  assertNoPostDeathTurns(nextResolutions);

  const terminal =
    isTerminalResolution(resolution);

  return {
    ...run,

    // Canon grows exactly once per turn
    resolutions: nextResolutions,

    // Ledger sealed later (persistence boundary)
    ledger: run.ledger,

    // Terminal flags
    isComplete: terminal,
    endedAt: terminal
      ? Date.now()
      : run.endedAt,
  };
}
