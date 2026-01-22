// ------------------------------------------------------------
// Solace Resolution Persistence
// ------------------------------------------------------------
// Supabase Storage Adapter
//
// Purpose:
// - Persist resolution runs to Supabase
// - Load runs for replay and analysis
// - Append-only semantics preserved
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

export async function saveRun(
  run: ResolutionRun
): Promise<void> {
  const { error } = await supabase
    .from("solace_runs")
    .upsert({
      id: run.id,
      started_at: run.startedAt,
      ended_at: run.endedAt ?? null,
      is_complete: run.isComplete,
      payload: run,
    });

  if (error) {
    throw new Error(
      `Failed to save run: ${error.message}`
    );
  }
}

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

export async function listRuns(): Promise<
  ResolutionRun[]
> {
  const { data, error } = await supabase
    .from("solace_runs")
    .select("payload")
    .order("started_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((r) => r.payload as ResolutionRun);
}
