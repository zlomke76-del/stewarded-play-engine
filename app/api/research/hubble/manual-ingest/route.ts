// --------------------------------------------------------------
// Hubble Ingest — MANUAL ADMIN TRIGGER
// Explicit, Auth-Gated, Same Code Path as Cron
// --------------------------------------------------------------
// - NOT scheduled
// - Requires admin secret header
// - Calls canonical ingest logic
// --------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ==============================================================
   ENV
================================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HUBBLE_ADMIN_SECRET = process.env.HUBBLE_ADMIN_SECRET;

if (!HUBBLE_ADMIN_SECRET) {
  console.warn("[HUBBLE-MANUAL] HUBBLE_ADMIN_SECRET not set");
}

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

/* ==============================================================
   CANONICAL SOURCE (SHARED)
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
        citation: "Hubble Space Telescope (Manual Ingest)",
        dataset_id: "HST-TEST-0001",
        ingested_at: new Date().toISOString(),
      },
    },
  ];
}

/* ==============================================================
   HANDLER
================================================================ */

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-hubble-admin-secret");

    if (!HUBBLE_ADMIN_SECRET || secret !== HUBBLE_ADMIN_SECRET) {
      console.warn("[HUBBLE-MANUAL] unauthorized attempt");
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin unavailable" },
        { status: 500 }
      );
    }

    console.log("[HUBBLE-MANUAL] admin ingest started");

    const candidates = loadCanonicalHubbleEvents();

    const { data: existing } = await supabase
      .schema("research")
      .from("hubble_ingest_v1")
      .select("event_id");

    const existingIds = new Set(
      (existing ?? []).map((r: any) => r.event_id)
    );

    const toInsert = candidates.filter(
      (e) => !existingIds.has(e.event_id)
    );

    if (toInsert.length === 0) {
      console.log("[HUBBLE-MANUAL] noop (0 new)");
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

    await supabase
      .schema("research")
      .from("hubble_ingest_v1")
      .insert(rows);

    console.log("[HUBBLE-MANUAL] inserted", { count: rows.length });

    return NextResponse.json({
      ok: true,
      inserted: rows.length,
    });
  } catch (err: any) {
    console.error("[HUBBLE-MANUAL] failed", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Manual ingest failed" },
      { status: 500 }
    );
  }
}
