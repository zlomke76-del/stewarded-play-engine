// lib/temporal-engine.ts
// Phase 5 — Temporal Signal Engine (Governor-Controlled)

import "server-only";
import { evaluateProactivity } from "./proactivity-governor";

export type TemporalMarker = {
  id: string;
  user_key: string;
  workspace_id?: string | null;

  related_entity?: string; // e.g. "Mom", "Brother"
  marker_type: string;     // birthday, anniversary, loss, milestone
  marker_date: string;     // ISO date (YYYY-MM-DD)

  posture?: {
    mode: "neutral" | "gentle" | "formal" | "quiet";
    reason?: string;
  };

  sensitivity: number;     // 1–5
};

export type TemporalEvaluationResult = {
  marker_id: string;
  decision: ReturnType<typeof evaluateProactivity>;
};

/* ============================================================
   Temporal evaluation (called daily or on demand)
   ============================================================ */

export function evaluateTemporalMarker(
  marker: TemporalMarker,
  todayISO: string,
  consent: {
    granted: boolean;
    scope?: string;
    expires_at?: string | null;
  }
): TemporalEvaluationResult {
  const decision = evaluateProactivity({
    user_key: marker.user_key,
    workspace_id: marker.workspace_id ?? null,

    trigger: {
      type: "temporal",
      reference: marker.marker_type,
      date: marker.marker_date,
    },

    consent,
    posture: marker.posture,
    sensitivity: marker.sensitivity,
  });

  return {
    marker_id: marker.id,
    decision,
  };
}
