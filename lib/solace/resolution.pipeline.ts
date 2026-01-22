// ------------------------------------------------------------
// Solace Resolution Pipeline (SERVER)
// ------------------------------------------------------------
// Scenario + Validation (AUTHORITATIVE)
//
// Purpose:
// - Transform legacy / draft payloads into canonical SolaceResolution
// - Inject structural outcome bounds (OutcomeEnvelope)
// - Allow Solace to adjudicate freely *within* those bounds
//
// MUST NOT be imported by client components
// ------------------------------------------------------------

import type { SolaceResolution } from "./solaceResolution.schema";
import { validateSolaceResolution } from "./resolution.validator";
import {
  SCENARIO_LIBRARY,
  ScenarioTag,
} from "./resolution.scenarios";
import { mapLegacyResolutionToSolace } from "./resolution.mapper";

// NEW — structural authority
import {
  buildOutcomeEnvelope,
  RiskSignals,
} from "@/lib/solace/outcomes/OutcomeEnvelope";

// NEW — interpretive authority
import { resolveWithinEnvelope } from "./resolveWithinEnvelope";

// ------------------------------------------------------------
// Scenario Selection (unchanged)
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
// Canonical Resolution Builder (AUTHORITATIVE)
// ------------------------------------------------------------

export function buildSolaceResolution(input: {
  legacyPayload: any;
  turn: number;

  // NEW — contextual signals (server-inferred)
  riskSignals: RiskSignals;
  intentType: "rest" | "hunt" | "gather" | "travel" | "tend";

  // NEW — current pressures
  context: {
    food: number;
    stamina: number;
    fire: number;
    hasShelter: boolean;
    hasFire: boolean;
    injuryLevel?: "none" | "minor" | "major";
  };
}): SolaceResolution {
  // ------------------------------------------------------------
  // 1. Map legacy payload → base SolaceResolution
  // ------------------------------------------------------------

  const base = mapLegacyResolutionToSolace(
    input.legacyPayload
  );

  // ------------------------------------------------------------
  // 2. Select scenario framing (unchanged)
  // ------------------------------------------------------------

  const scenarioTag = selectScenarioTag(input.turn);
  const scenario = SCENARIO_LIBRARY[scenarioTag];

  // ------------------------------------------------------------
  // 3. Construct Outcome Envelope (STRUCTURAL AUTHORITY)
  // ------------------------------------------------------------

  const envelope = buildOutcomeEnvelope({
    signals: input.riskSignals,
    intentType: input.intentType,
    context: {
      hasShelter: input.context.hasShelter,
      hasFire: input.context.hasFire,
      injuryLevel: input.context.injuryLevel,
    },
  });

  // ------------------------------------------------------------
  // 4. Solace adjudicates INSIDE the envelope
  // ------------------------------------------------------------

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

    // These deltas must already be chosen by Solace reasoning
    // (never by client, never by math tables)
    chosenDeltas: base.mechanical_resolution ?? {},

    narration: {
      opening: base.opening_signal,
      frame: base.situation_frame.join(" "),
      process: base.process.join(" "),
      aftermath: base.aftermath.join(" "),
    },
  });

  // ------------------------------------------------------------
  // 5. Scenario enrichment (narrative only, unchanged)
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // 6. Final validation (HARD STOP)
  // ------------------------------------------------------------

  if (!validateSolaceResolution(enriched)) {
    throw new Error(
      "Invalid SolaceResolution produced by pipeline"
    );
  }

  return enriched;
}
