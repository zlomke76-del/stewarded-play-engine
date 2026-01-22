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
// Run Phase (AUTHORITATIVE)
// ------------------------------------------------------------

export enum RunPhase {
  ACTIVE = "active",
  TERMINAL = "terminal",
}

// ------------------------------------------------------------
// Run Shape
// ------------------------------------------------------------

export interface ResolutionRun {
  id: string;
  startedAt: number;
  endedAt?: number;

  // Canon
  resolutions: SolaceResolution[];

  // Memory
  ledger: LedgerEntry[];

  // Authority
  phase: RunPhase;
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
    phase: RunPhase.ACTIVE,
  };
}

// ------------------------------------------------------------
// Canon Append (AUTHORITATIVE)
// ------------------------------------------------------------

export function appendResolution(
  run: ResolutionRun,
  resolution: SolaceResolution
): ResolutionRun {
  // Hard authority gate
  if (run.phase !== RunPhase.ACTIVE) {
    throw new Error(
      "Invariant violation: resolutions appended after terminal phase"
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

    // Canon grows
    resolutions: nextResolutions,

    // Ledger is sealed later (persistence boundary)
    ledger: run.ledger,

    // Phase transition (explicit, irreversible)
    phase: terminal
      ? RunPhase.TERMINAL
      : RunPhase.ACTIVE,

    endedAt: terminal
      ? Date.now()
      : run.endedAt,
  };
}
