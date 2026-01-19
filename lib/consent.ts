// lib/consent.ts
// Phase 5 — Consent Engine (Authoritative)

import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export type ConsentCheck = {
  allowed: boolean;
  reason: string;
  expires_at?: string | null;
};

export async function checkConsent(params: {
  user_id: string;
  workspace_id?: string | null;
  scope: string;
}): Promise<ConsentCheck> {
  const { data } = await supabase
    .from("memory_consent")
    .select("*")
    .eq("user_id", params.user_id)
    .eq("scope", params.scope)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return { allowed: false, reason: "no_consent_record" };
  }

  if (data.revoked_at) {
    return { allowed: false, reason: "consent_revoked" };
  }

  if (!data.granted) {
    return { allowed: false, reason: "consent_not_granted" };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { allowed: false, reason: "consent_expired" };
  }

  return {
    allowed: true,
    reason: "consent_valid",
    expires_at: data.expires_at,
  };
}
