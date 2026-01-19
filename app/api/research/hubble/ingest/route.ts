// --------------------------------------------------------------
// Hubble Ingest — Scheduled, Deterministic, Append-Only
// AUTHORITATIVE INGESTION PATH
// --------------------------------------------------------------
// - Triggered ONLY by Vercel cron
// - NO cookies
// - NO user context
// - NO chat / Solace coupling
// - Idempotent by event_id
// --------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ==============================================================
   ENV / SUPABASE ADMIN
================================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[HUBBLE-INGEST] missing Supabase env");
}

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

/* ==============================================================
   INTERNAL CANONICAL SOURCE (PHASE 1)
   Replace this source in Phase 2 with MAST metadata pull
================================================================ */

function loadCanonicalHubbleEvents() {
  return [
    {
      event_id: "hst-test-0001",
      schema_version: "v1",
      timestamp_utc: "2025-12-13T01:58:57.309Z",
      instrument_mode: "WFC3-imaging",
      exposure_time: 1200.5,
      target_ra: 210.8023,
      target_dec: 54.3489,
      data_quality_flags: { flags: [], quality: "nominal" },
      payload_ref: "mast://placeholder/test-payload",
      calibration_version: "cal-v4.3",
      source_provenance: {
        source: "NASA/STScI",
        license: "public-domain",
        citation: "Hubble Space Telescope (Test Ingest)",
        dataset_id: "HST-TEST-0001",
        ingested_at: new Date().toISOString(),
      },
    },
  ];
}

/* ==============================================================
   ROUTE HANDLER (CRON)
================================================================ */

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin unavailable" },
      { status: 500 }
    );
  }

  try {
    console.log("[HUBBLE-INGEST] job started");

    const candidates = loadCanonicalHubbleEvents();

    if (!Array.isArray(candidates) || candidates.length === 0) {
      console.log("[HUBBLE-INGEST] noop (no source events)");
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    // Fetch existing event_ids
    const { data: existingRows, error: readErr } = await supabase
      .schema("research")
      .from("hubble_ingest_v1")
      .select("event_id");

    if (readErr) {
      throw readErr;
    }

    const existingIds = new Set(
      (existingRows ?? []).map((r: any) => r.event_id)
    );

    const toInsert = candidates.filter(
      (e) => !existingIds.has(e.event_id)
    );

    if (toInsert.length === 0) {
      console.log("[HUBBLE-INGEST] noop (0 new)");
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    const rows = toInsert.map((e) => ({
      event_id: e.event_id,
      schema_version: e.schema_version,
      timestamp_utc: e.timestamp_utc,
      instrument_mode: e.instrument_mode,
      exposure_time: e.exposure_time,
      target_ra: e.target_ra,
      target_dec: e.target_dec,
      data_quality_flags: JSON.stringify(e.data_quality_flags),
      payload_ref: e.payload_ref,
      calibration_version: e.calibration_version,
      source_provenance: JSON.stringify(e.source_provenance),
      inserted_at: new Date().toISOString(),
    }));

    const { error: insertErr } = await supabase
      .schema("research")
      .from("hubble_ingest_v1")
      .insert(rows);

    if (insertErr) {
      throw insertErr;
    }

    console.log("[HUBBLE-INGEST] inserted", { count: rows.length });

    return NextResponse.json({
      ok: true,
      inserted: rows.length,
    });
  } catch (err: any) {
    console.error("[HUBBLE-INGEST] failed", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Ingest failed" },
      { status: 500 }
    );
  }
}
