// ------------------------------------------------------------
// Governance — Reflection Ledger Insert (AUTHORITATIVE)
// Service-role only, append-only
// ------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import { ReflectionLedgerEntry } from "@/services/reflection/reflectionLedger.types";

// ------------------------------------------------------------
// ADMIN CLIENT (SERVICE ROLE)
// ------------------------------------------------------------
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ------------------------------------------------------------
// INSERT FUNCTION (THE ONLY WRITE PATH)
// ------------------------------------------------------------
export async function insertReflectionLedgerEntry(args: {
  entry: ReflectionLedgerEntry;
  userId: string;
  workspaceId?: string | null;
}) {
  const { entry, userId, workspaceId } = args;

  if (!entry?.id) {
    throw new Error("ReflectionLedgerEntry must have an id");
  }

  const { error } = await supabaseAdmin
    .schema("governance")
    .from("reflection_ledger")
    .insert({
      id: entry.id,
      user_id: userId,
      workspace_id: workspaceId ?? null,

      timestamp: entry.timestamp,

      source: entry.source,
      scope: entry.scope,

      snapshot: entry.snapshot,
      diff_summary: entry.diffSummary,
      inspection_summary: entry.inspectionSummary,
      inspection_findings: entry.inspectionFindings,

      assistive_signals: entry.assistiveSignals ?? null,
      human_disposition: entry.humanDisposition ?? null,

      invariants: entry.invariants,
    });

  if (error) {
    throw new Error(
      `Failed to insert reflection ledger entry: ${error.message}`
    );
  }
}
