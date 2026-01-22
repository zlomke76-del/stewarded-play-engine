// ------------------------------------------------------------
// Solace Resolution Persistence
// ------------------------------------------------------------
// Supabase Storage Adapter
//
// Purpose:
// - Persist resolution runs to Supabase
// - Load runs for replay and analysis
// - Preserve append-only and canonical semantics
// ------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import type { ResolutionRun } from "./resolution.run";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * saveRun
 *
 * Creates or updates a run record.
 * This function MUST NOT silently overwrite canon.
 *
 * Expected table behavior:
 * - id is PRIMARY KEY
 * - payload is JSONB
 * - RLS enforced
 */
export async function saveRun(
  run: ResolutionRun
): Promise<void> {
  const { error } = await supabase
    .from("solace_runs")
    .insert({
      id: run.id,
      started_at: run.startedAt,
      ended_at: run.endedAt ?? null,
      is_complete: run.isComplete,
      payload: run,
    })
    .onConflict("id")
    .ignore();

  if (error) {
    throw new Error(
      `Failed to persist run: ${error.message}`
    );
  }

  // If the run already exists, update ONLY terminal fields
  if (run.isComplete) {
    const { error: updateError } =
      await supabase
        .from("solace_runs")
        .update({
          ended_at: run.endedAt ?? Date.now(),
          is_complete: true,
        })
        .eq("id", run.id);

    if (updateError) {
      throw new Error(
        `Failed to finalize run: ${updateError.message}`
      );
    }
  }
}

/**
 * loadRun
 *
 * Loads a single run by ID.
 */
export async function loadRun(
  runId: string
): Promise<ResolutionRun | null> {
  const { data, error } = await supabase
    .from("solace_runs")
    .select("payload")
    .eq("id", runId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.payload as ResolutionRun;
}

/**
 * listRuns
 *
 * Returns runs ordered by start time (most recent first).
 */
export async function listRuns(): Promise<
  ResolutionRun[]
> {
  const { data, error } = await supabase
    .from("solace_runs")
    .select("payload, started_at")
    .order("started_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(
    (r) => r.payload as ResolutionRun
  );
}
