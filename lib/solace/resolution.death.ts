// ------------------------------------------------------------
// Solace Resolution Death Handling
// ------------------------------------------------------------
// Explicit Terminal-State Logic
//
// Purpose:
// - Detect terminal resolutions
// - Enforce end-of-run invariants
// - Keep death mechanical and silent
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";

export interface DeathRecord {
  turn: number;
  cause: string;
  resolution: SolaceResolution;
}

export function isTerminalResolution(
  resolution: SolaceResolution
): boolean {
  return (
    resolution.mechanical_resolution.outcome ===
      "failure" &&
    resolution.aftermath.some((l) =>
      l.toLowerCase().includes("death")
    )
  );
}

export function extractDeathRecord(
  resolutions: SolaceResolution[]
): DeathRecord | null {
  for (let i = 0; i < resolutions.length; i++) {
    const r = resolutions[i];
    if (isTerminalResolution(r)) {
      const causeLine =
        r.aftermath.find((l) =>
          l.toLowerCase().includes("death")
        ) ?? "death";

      return {
        turn: i + 1,
        cause: causeLine,
        resolution: r,
      };
    }
  }
  return null;
}

export function assertNoPostDeathTurns(
  resolutions: SolaceResolution[]
) {
  const deathIndex = resolutions.findIndex(
    isTerminalResolution
  );

  if (
    deathIndex !== -1 &&
    deathIndex < resolutions.length - 1
  ) {
    throw new Error(
      "Invariant violation: turns recorded after terminal death"
    );
  }
}
