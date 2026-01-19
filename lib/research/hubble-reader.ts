// ------------------------------------------------------------
// Hubble Research Context Reader
// READ-ONLY — DERIVED FROM EXISTING INGEST
// NEXT 16 COMPATIBLE
// ------------------------------------------------------------

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
export type HubbleResearchItem = {
  event_id: string;
  instrument_mode: string;
  timestamp_utc: string;
  source: string;
  summary: string;
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function safeRows<T>(rows: T[] | null): T[] {
  return Array.isArray(rows) ? rows : [];
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------
export async function readHubbleResearchContext(
  limit: number
): Promise<HubbleResearchItem[]> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  // ----------------------------------------------------------
  // READ DIRECTLY FROM EXISTING INGEST VIEW
  // ----------------------------------------------------------
  const { data, error } = await supabase
    .schema("research")
    .from("hubble_ingest_v1")
    .select(
      `
      event_id,
      instrument_mode,
      timestamp_utc,
      source_provenance
    `
    )
    .order("timestamp_utc", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[HUBBLE READER ERROR]", error.message);
    return [];
  }

  // ----------------------------------------------------------
  // Derive AI-safe context WITHOUT altering DB
  // ----------------------------------------------------------
  return safeRows(data).map((row: any) => ({
    event_id: row.event_id,
    instrument_mode: row.instrument_mode,
    timestamp_utc: row.timestamp_utc,
    source: row.source_provenance?.source ?? "unknown",
    summary: `Hubble observation (${row.instrument_mode}) recorded at ${row.timestamp_utc}.`,
  }));
}
