// lib/memory-recall.ts
// Phase 4.5 — Read-Only Memory Recall (No mutation, No synthesis)

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { MemoryEvidence } from "./memory-evidence";

/* ============================================================
   Supabase (service role, read-only intent)
   ============================================================ */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/* ============================================================
   Recall memory evidence (ranked, neutral)
   ============================================================ */

export async function recallMemoryEvidence(params: {
  user_key: string;
  workspace_id?: string | null;
  limit?: number;
}): Promise<MemoryEvidence[]> {
  const { user_key, workspace_id = null, limit = 25 } = params;

  let query = supabase
    .from("user_memories")
    .select(
      `
      id,
      content,
      confidence,
      importance,
      emotional_weight,
      sensitivity_score,
      created_at
    `
    )
    .eq("user_key", user_key);

  if (workspace_id) {
    query = query.eq("workspace_id", workspace_id);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // Light, explainable ranking — no intelligence here
  return data.map((m) => ({
    ...m,
    _score:
      (m.importance ?? 0) +
      (m.confidence ?? 0) * 2 -
      (m.sensitivity_score ?? 0) * 0.5,
  }));
}
