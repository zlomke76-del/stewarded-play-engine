// ------------------------------------------------------------
// Solace Resolution Pipeline (SERVER)
// ------------------------------------------------------------
// Scenario + Validation (AUTHORITATIVE)
//
// MUST NOT be imported by client components
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import { validateSolaceResolution } from "./resolution.validator";
import {
  SCENARIO_LIBRARY,
  ScenarioTag,
} from "./resolution.scenarios";

// ✅ Correct, canonical mapper import
import { mapToSolaceResolution } from "./resolution.mapper";

import {
  buildOutcomeEnvelope,
  RiskSignals,
} from "@/lib/solace/outcomes/OutcomeEnvelope";

import { resolveWithinEnvelope } from "./resolution/resolveWithinEnvelope";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function extractResourceDeltas(
  legacy: any
): {
  food?: number;
  stamina?: number;
  fire?: number;
} {
  if (!legacy || typeof legacy !== "object") return {};

  const { food, stamina, fire } = legacy;

  return {
    food: typeof food === "number" ? food : undefined,
    stamina: typeof stamina === "number" ? stamina : undefined,
    fire: typeof fire === "number" ? fire : undefined,
  };
}

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
// Canonical Resolution Builder
// ------------------------------------------------------------

export function buildSolaceResolution(input: {
  legacyPayload: any;
  turn: number;
  riskSignals: RiskSignals;
  intentType: "rest" | "hunt" | "gather" | "travel" | "tend";
  context: {
    food: number;
    stamina: number;
    fire: number;
    hasShelter: boolean;
    hasFire: boolean;
    injuryLevel?: "none" | "minor" | "major";
  };
}): SolaceResolution {
  // ✅ Correct mapper usage
  const base = mapToSolaceResolution(
    input.legacyPayload
  );

  const scenarioTag = selectScenarioTag(input.turn);
  const scenario = SCENARIO_LIBRARY[scenarioTag];

  const envelope = buildOutcomeEnvelope({
    signals: input.riskSignals,
    intentType: input.intentType,
    context: {
      hasShelter: input.context.hasShelter,
      hasFire: input.context.hasFire,
      injuryLevel: input.context.injuryLevel,
    },
  });

  const resolved = resolveWithinEnvelope({
    envelope,
    context: {
      narrativeIntent: base.opening_signal,
      currentState: {
        food: input.context.food,
        stamina: input.context.stamina,
        fire: input.context.fire,
      },
    },
    chosenDeltas: extractResourceDeltas(
      base.mechanical_resolution
    ),
    narration: {
      opening: base.opening_signal,
      frame: base.situation_frame.join(" "),
      process: base.process.join(" "),
      aftermath: base.aftermath.join(" "),
    },
  });

  const enriched: SolaceResolution = {
    ...resolved,
    situation_frame: [
      ...scenario.situation_lines,
      ...resolved.situation_frame,
    ].slice(0, 2),
    pressures: [
      ...scenario.pressure_lines,
      ...resolved.pressures,
    ].slice(0, 4),
    process: [
      ...scenario.process_lines,
      ...resolved.process,
    ].slice(0, 3),
    aftermath: [
      ...resolved.aftermath,
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

/* ------------------------------------------------------------
   EOF
   This file is authoritative and intentionally:
   - Server-only
   - Schema-bound
   - Mapper-contract respecting
------------------------------------------------------------ */
