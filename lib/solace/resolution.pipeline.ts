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

// Canonical mapper (NO authority)
import { mapToSolaceResolution } from "./resolution.mapper";

import {
  buildOutcomeEnvelope,
  RiskSignals,
} from "@/lib/solace/outcomes/OutcomeEnvelope";

import { resolveWithinEnvelope } from "./resolution/resolveWithinEnvelope";
import { enforceGuardrails } from "./resolution.guardrails";

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
// WorldDelta → Envelope Delta Projection
// ------------------------------------------------------------
// This is the ONLY allowed boundary crossing.
// WorldDelta is broader than what the envelope accepts.
// ------------------------------------------------------------

function projectWorldDeltaToEnvelopeDeltas(
  delta: unknown
): {
  food?: number;
  stamina?: number;
  fire?: number;
} {
  if (!delta || typeof delta !== "object") {
    return {};
  }

  const d = delta as any;

  return {
    food: typeof d.food === "number" ? d.food : undefined,
    stamina:
      typeof d.stamina === "number"
        ? d.stamina
        : undefined,
    fire:
      typeof d.fire === "number" ? d.fire : undefined,
  };
}

// ------------------------------------------------------------
// Canonical Resolution Builder
// ------------------------------------------------------------

export function buildSolaceResolution(input: {
  legacyPayload: any;
  turn: number;
  riskSignals: RiskSignals;
  intentType:
    | "rest"
    | "hunt"
    | "gather"
    | "travel"
    | "tend";
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
  // Phase 1 — Legacy normalization (NO authority)
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
  // 🔒 INVARIANT:
  // Narrative remains semantic arrays.
  // No flattening, no joins, no formatting.
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

    chosenDeltas:
      projectWorldDeltaToEnvelopeDeltas(
        world_delta
      ),

    narration: {
      opening: base.opening_signal,
      frame: base.situation_frame,
      process: base.process,
      aftermath: base.aftermath,
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
  // Phase 6 — Validation & Guardrails (NON-NEGOTIABLE)
  // ----------------------------------------------------------

  if (!validateSolaceResolution(enriched)) {
    throw new Error(
      "Invalid SolaceResolution produced by pipeline"
    );
  }

  enforceGuardrails(enriched);

  return enriched;
}

/* ------------------------------------------------------------
   EOF

   Invariants preserved:
   - Canonical narrative shape is string[]
   - No narrative flattening inside /lib/solace
   - Envelope owns mechanics
   - Mapper never grants authority
   - WorldDelta never crosses unprojected
   - Guardrails enforce runtime integrity
   - Canon is append-only and auditable

------------------------------------------------------------ */
