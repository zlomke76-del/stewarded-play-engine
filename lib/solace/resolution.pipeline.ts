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

// Canonical mapper
import { mapToSolaceResolution } from "./resolution.mapper";

import {
  buildOutcomeEnvelope,
  RiskSignals,
} from "@/lib/solace/outcomes/OutcomeEnvelope";

import { resolveWithinEnvelope } from "./resolution/resolveWithinEnvelope";

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
  // ----------------------------------------------------------
  // Phase 1 — Legacy normalization (NO authority here)
  // ----------------------------------------------------------

  const {
    resolution: base,
    world_delta,
  } = mapToSolaceResolution(input.legacyPayload);

  // ----------------------------------------------------------
  // Phase 2 — Scenario context
  // ----------------------------------------------------------

  const scenarioTag = selectScenarioTag(input.turn);
  const scenario = SCENARIO_LIBRARY[scenarioTag];

  // ----------------------------------------------------------
  // Phase 3 — Outcome envelope (STRUCTURAL LIMITS)
  // ----------------------------------------------------------

  const envelope = buildOutcomeEnvelope({
    signals: input.riskSignals,
    intentType: input.intentType,
    context: {
      hasShelter: input.context.hasShelter,
      hasFire: input.context.hasFire,
      injuryLevel: input.context.injuryLevel,
    },
  });

  // ----------------------------------------------------------
  // Phase 4 — Interpretive authority (Solace)
  // ----------------------------------------------------------

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

    // 🔑 CRITICAL FIX:
    // world_delta is the ONLY valid source of deltas here.
    // base.mechanical_resolution may not exist and must never be read.
    chosenDeltas: world_delta ?? {},

    narration: {
      opening: base.opening_signal,
      frame: base.situation_frame.join(" "),
      process: base.process.join(" "),
      aftermath: base.aftermath.join(" "),
    },
  });

  // ----------------------------------------------------------
  // Phase 5 — Scenario enrichment (bounded, non-authoritative)
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // Phase 6 — Validation (NON-NEGOTIABLE)
  // ----------------------------------------------------------

  if (!validateSolaceResolution(enriched)) {
    throw new Error(
      "Invalid SolaceResolution produced by pipeline"
    );
  }

  return enriched;
}

/* ------------------------------------------------------------
   EOF

   Invariants preserved:
   - Envelope owns mechanics
   - Mapper never grants authority
   - No optional field is destructured
   - RPG intent is reciprocated, not negated
   - Canon remains append-only and auditable

------------------------------------------------------------ */
