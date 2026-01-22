// ------------------------------------------------------------
// Solace Resolution Pipeline
// ------------------------------------------------------------
// Scenario Selection + Mapping + Validation
//
// Purpose:
// - Assemble a SolaceResolution deterministically
// - Select bounded scenario texture
// - Validate before persistence or render
//
// This pipeline:
// - Does NOT alter mechanics
// - Does NOT decide outcomes
// - Only composes already-authoritative data
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import { validateSolaceResolution } from "./resolution.validator";
import {
  SCENARIO_LIBRARY,
  ScenarioTag,
} from "./resolution.scenarios";
import { mapLegacyResolutionToSolace } from "./resolution.mapper";

// ------------------------------------------------------------
// Scenario Selection
// ------------------------------------------------------------

export function selectScenarioTag(
  turn: number
): ScenarioTag {
  const tags = Object.keys(
    SCENARIO_LIBRARY
  ) as ScenarioTag[];

  // Deterministic but varied: turn-based rotation
  return tags[turn % tags.length];
}

// ------------------------------------------------------------
// Pipeline Assembly
// ------------------------------------------------------------

interface PipelineInput {
  legacyPayload: any;
  turn: number;
}

export function buildSolaceResolution(
  input: PipelineInput
): SolaceResolution {
  const base = mapLegacyResolutionToSolace(
    input.legacyPayload
  );

  const scenarioTag = selectScenarioTag(input.turn);
  const scenario = SCENARIO_LIBRARY[scenarioTag];

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

  if (!validateSolaceResolution(enriched)) {
    throw new Error(
      "Invalid SolaceResolution produced by pipeline"
    );
  }

  return enriched;
}
