// ------------------------------------------------------------
// selectSurvivalResources
// ------------------------------------------------------------
// Purpose:
// - Derive current survival pressures from SessionState
// - Read-only, deterministic, replayable
// - NO decision-making
// ------------------------------------------------------------

import type { SessionState } from "../SessionState";

export type SurvivalResources = {
  food: number;
  stamina: number;
  fire: number;
};

const DEFAULTS: SurvivalResources = {
  food: 0,
  stamina: 0,
  fire: 0,
};

export function selectSurvivalResources(
  state: SessionState
): SurvivalResources {
  let resources = { ...DEFAULTS };

  for (const event of state.events) {
    if (event.type !== "OUTCOME") continue;

    const payload = event.payload as any;

    // Canonical deltas ONLY
    const deltas = payload?.resources;
    if (!deltas || typeof deltas !== "object") continue;

    if (typeof deltas.foodDelta === "number") {
      resources.food += deltas.foodDelta;
    }

    if (typeof deltas.staminaDelta === "number") {
      resources.stamina += deltas.staminaDelta;
    }

    if (typeof deltas.fireDelta === "number") {
      resources.fire += deltas.fireDelta;
    }
  }

  return resources;
}
