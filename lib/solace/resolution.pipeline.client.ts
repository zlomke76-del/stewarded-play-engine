// ------------------------------------------------------------
// Solace Resolution Pipeline (CLIENT)
// ------------------------------------------------------------
// Scenario Selection + Mapping ONLY
//
// Guarantees:
// - No validation
// - No throws
// - No Node assumptions
// - Browser-safe at import time
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import {
  SCENARIO_LIBRARY,
  ScenarioTag,
} from "./resolution.scenarios";

// ✅ Correct mapper import (matches server + existing export)
import { mapToSolaceResolution } from "./resolution.mapper";

// ------------------------------------------------------------
// Scenario Selection (deterministic, safe)
// ------------------------------------------------------------

export function selectScenarioTag(
  turn: number
): ScenarioTag {
  const tags = Object.keys(
    SCENARIO_LIBRARY
  ) as ScenarioTag[];

  return tags[turn % tags.length];
}

// ------------------------------------------------------------
// Client Assembly (NO VALIDATION)
// ------------------------------------------------------------

export function buildSolaceResolutionClient(
  input: {
    legacyPayload: any;
    turn: number;
  }
): SolaceResolution {
  // ✅ Correct mapper usage
  const base = mapToSolaceResolution(
    input.legacyPayload
  );

  const scenarioTag = selectScenarioTag(input.turn);
  const scenario = SCENARIO_LIBRARY[scenarioTag];

  return {
    ...base,

    situation_frame: [
      ...scenario.situation_lines,
      ...base.situation_frame,
    ].slice(0, 2),

    pressures: [
      ...scenario.pressure_lines,
      ...base.pressures,
    ].slice(0, 4),

    process: [
      ...scenario.process_lines,
      ...base.process,
    ].slice(0, 3),

    aftermath: [
      ...base.aftermath,
      ...scenario.aftermath_lines,
    ].slice(0, 3),
  };
}

/* ------------------------------------------------------------
   EOF
   Client-only pipeline:
   - No validation
   - No authority
   - No schema mutation
------------------------------------------------------------ */
