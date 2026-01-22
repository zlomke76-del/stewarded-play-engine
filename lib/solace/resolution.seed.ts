// ------------------------------------------------------------
// Solace Resolution Seed
// ------------------------------------------------------------
// Deterministic Variation Seeding
//
// Purpose:
// - Ensure replayable but non-repetitive variation
// - Keep scenario selection deterministic per run
// ------------------------------------------------------------

import type { ScenarioTag } from "./resolution.scenarios";
import { SCENARIO_LIBRARY } from "./resolution.scenarios";

// Simple deterministic hash
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash =
      (hash << 5) -
      hash +
      input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function selectScenarioWithSeed(
  seed: string,
  turn: number
): ScenarioTag {
  const tags = Object.keys(
    SCENARIO_LIBRARY
  ) as ScenarioTag[];

  const hash = hashString(
    `${seed}:${turn}`
  );

  return tags[hash % tags.length];
}
