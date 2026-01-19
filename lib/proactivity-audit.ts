// lib/proactivity-audit.ts
// Phase 5 — Proactivity Explainability Ledger

import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function writeProactivityAudit(entry: {
  user_id: string;
  workspace_id?: string | null;

  trigger_type: string;
  trigger_ref?: string;
  trigger_date?: string;

  decision: "act" | "defer" | "silence" | "blocked";
  action?: string | null;

  consent: {
    granted: boolean;
    scope?: string;
    expires_at?: string | null;
  };

  sensitivity: number;
  posture?: string | null;

  explanation: string;
  rationale: Record<string, any>;
}) {
  const { error } = await supabase
    .from("proactivity_audit")
    .insert({
      user_id: entry.user_id,
      workspace_id: entry.workspace_id ?? null,

      trigger_type: entry.trigger_type,
      trigger_ref: entry.trigger_ref ?? null,
      trigger_date: entry.trigger_date ?? null,

      decision: entry.decision,
      action: entry.action ?? null,

      consent_granted: entry.consent.granted,
      consent_scope: entry.consent.scope ?? null,
      consent_expires_at: entry.consent.expires_at ?? null,

      sensitivity: entry.sensitivity,
      posture: entry.posture ?? null,

      explanation: entry.explanation,
      rationale: entry.rationale,
    });

  if (error) {
    throw new Error(`[proactivity.audit] ${error.message}`);
  }
}
