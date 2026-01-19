// lib/proactivity-governor.ts
// Phase 5 — Proactivity Governor
// Enforces consent, posture, sensitivity, and logs every decision.

import "server-only";

import { buildExplanation } from "./explainability";
import { writeProactivityAudit } from "./proactivity-audit";

/* ============================================================
   Types
   ============================================================ */

export type ProactiveAction =
  | "reminder"
  | "suggestion"
  | "outreach"
  | "agent_action"
  | "silence";

export type ProactivityContext = {
  user_key: string;
  workspace_id?: string | null;

  trigger: {
    type: "temporal" | "relational" | "memory" | "system";
    reference?: string;
    date?: string;
  };

  consent: {
    granted: boolean;
    scope?: string;
    expires_at?: string | null;
  };

  posture?: {
    mode: "neutral" | "gentle" | "formal" | "quiet";
    reason?: string;
  };

  sensitivity: number; // 1–5
};

export type ProactivityDecision = {
  allowed: boolean;
  action: ProactiveAction;
  explanation: ReturnType<typeof buildExplanation>;
};

/* ============================================================
   Governor
   ============================================================ */

export async function evaluateProactivity(
  ctx: ProactivityContext
): Promise<ProactivityDecision> {
  /* ------------------------------------------------------------
     1. Consent gate (absolute)
     ------------------------------------------------------------ */

  if (!ctx.consent.granted) {
    const explanation = buildExplanation({
      type: "proactivity",
      summary: "No action taken.",
      details: [
        "Required consent was not granted.",
        "System defaulted to silence.",
      ],
    });

    await writeProactivityAudit({
      user_id: ctx.user_key,
      workspace_id: ctx.workspace_id ?? null,

      trigger_type: ctx.trigger.type,
      trigger_ref: ctx.trigger.reference,
      trigger_date: ctx.trigger.date,

      decision: "blocked",
      action: "none",

      consent: ctx.consent,
      sensitivity: ctx.sensitivity,
      posture: ctx.posture?.mode ?? null,

      explanation: explanation.summary,
      rationale: explanation,
    });

    return {
      allowed: false,
      action: "silence",
      explanation,
    };
  }

  /* ------------------------------------------------------------
     2. Sensitivity gate
     ------------------------------------------------------------ */

  if (ctx.sensitivity >= 4) {
    const explanation = buildExplanation({
      type: "proactivity",
      summary: "Action suppressed due to sensitivity.",
      details: [
        "Context classified as emotionally or ethically sensitive.",
        "Silence chosen to preserve dignity.",
      ],
    });

    await writeProactivityAudit({
      user_id: ctx.user_key,
      workspace_id: ctx.workspace_id ?? null,

      trigger_type: ctx.trigger.type,
      trigger_ref: ctx.trigger.reference,
      trigger_date: ctx.trigger.date,

      decision: "silence",
      action: "none",

      consent: ctx.consent,
      sensitivity: ctx.sensitivity,
      posture: ctx.posture?.mode ?? null,

      explanation: explanation.summary,
      rationale: explanation,
    });

    return {
      allowed: false,
      action: "silence",
      explanation,
    };
  }

  /* ------------------------------------------------------------
     3. Posture gate
     ------------------------------------------------------------ */

  if (ctx.posture?.mode === "quiet") {
    const explanation = buildExplanation({
      type: "proactivity",
      summary: "Action deferred.",
      details: [
        "Current posture is set to quiet.",
        "No proactive engagement permitted in this state.",
      ],
    });

    await writeProactivityAudit({
      user_id: ctx.user_key,
      workspace_id: ctx.workspace_id ?? null,

      trigger_type: ctx.trigger.type,
      trigger_ref: ctx.trigger.reference,
      trigger_date: ctx.trigger.date,

      decision: "defer",
      action: "none",

      consent: ctx.consent,
      sensitivity: ctx.sensitivity,
      posture: ctx.posture.mode,

      explanation: explanation.summary,
      rationale: explanation,
    });

    return {
      allowed: false,
      action: "silence",
      explanation,
    };
  }

  /* ------------------------------------------------------------
     4. Allowed — minimal proactive action
     ------------------------------------------------------------ */

  const explanation = buildExplanation({
    type: "proactivity",
    summary: "Proactive action permitted.",
    details: [
      "Consent verified.",
      "Sensitivity within acceptable bounds.",
      "Posture allows engagement.",
    ],
  });

  await writeProactivityAudit({
    user_id: ctx.user_key,
    workspace_id: ctx.workspace_id ?? null,

    trigger_type: ctx.trigger.type,
    trigger_ref: ctx.trigger.reference,
    trigger_date: ctx.trigger.date,

    decision: "act",
    action: "reminder",

    consent: ctx.consent,
    sensitivity: ctx.sensitivity,
    posture: ctx.posture?.mode ?? null,

    explanation: explanation.summary,
    rationale: explanation,
  });

  return {
    allowed: true,
    action: "reminder",
    explanation,
  };
}
