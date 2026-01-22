// ------------------------------------------------------------
// Solace Resolution Persistence
// ------------------------------------------------------------
// Supabase Storage Adapter
//
// Purpose:
// - Persist resolution runs to Supabase
// - Load runs for replay and analysis
// - Preserve append-only and canonical semantics
// - Seal World Ledger entries at time of persistence
// ------------------------------------------------------------

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ResolutionRun } from "./resolution.run";
import type { SolaceResolution } from "./solaceResolution.schema";
import {
  buildLedgerEntry,
  LedgerEntry,
} from "./resolution.ledger";

// ------------------------------------------------------------
// Lazy client initialization (CRITICAL)
// ------------------------------------------------------------

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  // Client-side: persistence is disabled
  if (typeof window !== "undefined") {
    return null;
  }

  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars missing on server");
  }

  supabase = createClient(url, key);
  return supabase;
}

// ------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------

function sealLedger(
  run: ResolutionRun
): ResolutionRun {
  const resolutions = run.resolutions;
  const ledger = run.ledger ?? [];

  // No new resolution → no new ledger entry
  if (resolutions.length === ledger.length) {
    return run;
  }

  // Append exactly one new ledger entry
  const latestResolution: SolaceResolution =
    resolutions[resolutions.length - 1];

  const turn = resolutions.length;

  const entry: LedgerEntry = buildLedgerEntry(
    latestResolution,
    turn
  );

  return {
    ...run,
    ledger: [...ledger, entry],
  };
}

// ------------------------------------------------------------
// Persistence API
// ------------------------------------------------------------

export async function saveRun(
  run: ResolutionRun
): Promise<void> {
  const client = getSupabase();
  if (!client) return; // client-side no-op

  // Seal ledger before persistence (CANON → MEMORY)
  const sealedRun = sealLedger(run);

  // 1️⃣ Attempt insert (creation)
  const { error: insertError } = await client
    .from("solace_runs")
    .insert({
      id: sealedRun.id,
      started_at: sealedRun.startedAt,
      ended_at: sealedRun.endedAt ?? null,
      is_complete: sealedRun.isComplete,
      payload: sealedRun,
    });

  // Ignore duplicate-key error (run already exists)
  if (
    insertError &&
    insertError.code !== "23505"
  ) {
    throw new Error(
      `Failed to insert run: ${insertError.message}`
    );
  }

  // 2️⃣ Finalize run explicitly if terminal
  if (sealedRun.isComplete) {
    const { error: updateError } =
      await client
        .from("solace_runs")
        .update({
          ended_at:
            sealedRun.endedAt ?? Date.now(),
          is_complete: true,
          payload: sealedRun,
        })
        .eq("id", sealedRun.id);

    if (updateError) {
      throw new Error(
        `Failed to finalize run: ${updateError.message}`
      );
    }
  }
}

export async function loadRun(
  runId: string
): Promise<ResolutionRun | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
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
  const client = getSupabase();
  if (!client) return [];

  const { data, error } =
    await client
      .from("solace_runs")
      .select("payload, started_at")
      .order("started_at", {
        ascending: false,
      });

  if (error || !data) {
    return [];
  }

  return data.map(
    (r) => r.payload as ResolutionRun
  );
}
