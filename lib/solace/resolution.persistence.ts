// ------------------------------------------------------------
// Solace Resolution Persistence
// ------------------------------------------------------------
// Supabase Storage Adapter (SERVER-ONLY)
//
// Invariants:
// - Persistence is server-only
// - Canon is append-only
// - Ledger is sealed exactly once per resolution
// - No env access on client
// - No eager throws during module load
// ------------------------------------------------------------

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ResolutionRun } from "./resolution.run";
import type { SolaceResolution } from "./solaceResolution.schema";
import {
  buildLedgerEntry,
  LedgerEntry,
} from "./resolution.ledger";

// ------------------------------------------------------------
// Lazy Supabase client (STRICT, SERVER-ONLY)
// ------------------------------------------------------------

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  // Absolute invariant: never initialize on client
  if (typeof window !== "undefined") {
    return null;
  }

  if (supabase) return supabase;

  // 🔒 SERVER-ONLY VARS (NOT NEXT_PUBLIC)
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If persistence is not configured, fail CLOSED but SAFE
  if (!url || !key) {
    return null;
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  return supabase;
}

// ------------------------------------------------------------
// Ledger sealing (append-only, deterministic)
// ------------------------------------------------------------

function sealLedger(run: ResolutionRun): ResolutionRun {
  const resolutions = run.resolutions;
  const ledger = run.ledger ?? [];

  // Nothing new → nothing to seal
  if (resolutions.length === ledger.length) {
    return run;
  }

  // Exactly ONE new entry per resolution
  const latest: SolaceResolution =
    resolutions[resolutions.length - 1];

  const turn = resolutions.length;

  const entry: LedgerEntry = buildLedgerEntry(
    latest,
    turn
  );

  return {
    ...run,
    ledger: [...ledger, entry],
  };
}

// ------------------------------------------------------------
// Persistence API (NO THROW ON MISSING ENV)
// ------------------------------------------------------------

export async function saveRun(
  run: ResolutionRun
): Promise<void> {
  const client = getSupabase();

  // Persistence disabled or unavailable → no-op by design
  if (!client) return;

  const sealedRun = sealLedger(run);

  // 1️⃣ Insert (idempotent)
  const { error: insertError } = await client
    .from("solace_runs")
    .insert({
      id: sealedRun.id,
      started_at: sealedRun.startedAt,
      ended_at: sealedRun.endedAt ?? null,
      is_complete: sealedRun.isComplete,
      payload: sealedRun,
    });

  // Ignore duplicate key (run already exists)
  if (
    insertError &&
    insertError.code !== "23505"
  ) {
    throw new Error(
      `Failed to insert run: ${insertError.message}`
    );
  }

  // 2️⃣ Finalize if terminal
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

// ------------------------------------------------------------
// Load APIs (server-only callers)
// ------------------------------------------------------------

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

  const { data, error } = await client
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

/* ------------------------------------------------------------
   EOF

   This file now guarantees:
   - No Supabase access on client
   - No NEXT_PUBLIC leakage
   - No throws during demo / preview
   - Canon remains authoritative
   - Persistence activates ONLY when configured
------------------------------------------------------------ */
