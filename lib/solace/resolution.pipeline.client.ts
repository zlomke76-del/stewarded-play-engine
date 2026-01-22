// ------------------------------------------------------------
// Solace Resolution Pipeline (CLIENT)
// ------------------------------------------------------------
// Client-safe resolution shaping
// WorldDelta is carried but NOT rendered here
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import {
  SCENARIO_LIBRARY,
  ScenarioTag,
} from "./resolution.scenarios";

import { mapToSolaceResolution } from "./resolution.mapper";

// ------------------------------------------------------------
// Scenario Selection
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
// Client Resolution Builder
// ------------------------------------------------------------

export function buildClientSolaceResolution(input: {
  legacyPayload: any;
  turn: number;
}): SolaceResolution {
  // 🔑 Phase 1 change:
  // Mapper now returns { resolution, world_delta }
  const {
    resolution: base,
    world_delta,
  } = mapToSolaceResolution(input.legacyPayload);

  const scenarioTag = selectScenarioTag(input.turn);
  const scenario = SCENARIO_LIBRARY[scenarioTag];

  // IMPORTANT:
  // Client pipeline enriches NARRATIVE ONLY
  // world_delta is preserved elsewhere (server / canon)

  const enriched: SolaceResolution = {
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

  return enriched;
}

/* ------------------------------------------------------------
   EOF
   Client-safe
   Narrative-only enrichment
   WorldDelta handled upstream
------------------------------------------------------------ */
