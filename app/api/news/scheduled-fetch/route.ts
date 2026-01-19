// app/api/news/scheduled-fetch/route.ts
// ============================================================
// SCHEDULED NEWS FETCH (QUEUE-ONLY)
// Canonical, audited population of news_backfill_queue
// ============================================================
// This route:
//  - fetches approved sources
//  - normalizes URLs
//  - inserts into news_backfill_queue ONLY
//  - performs no ingestion, scoring, or ledger work
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ========= ENV ========= */

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NEWS_REFRESH_SECRET = process.env.NEWS_REFRESH_SECRET || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase service credentials");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/* ========= TYPES ========= */

type FetchedStory = {
  url: string;
  source: "rss" | "tavily";
};

/* ========= HELPERS ========= */

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/* ========= APPROVED FETCH SOURCES ========= */
/* 🔒 Explicitly curated. Expand only via review. */

async function fetchApprovedSources(): Promise<FetchedStory[]> {
  const results: FetchedStory[] = [];

  // Example placeholder: RSS / external fetch logic lives here.
  // This function MUST return only normalized URLs.
  // No inserts, no side effects.

  // --- INTENTIONALLY EMPTY ---
  // Replace with vetted fetch logic (RSS parser, external job, etc.)

  return results;
}

/* ========= MAIN ========= */

export async function POST(req: NextRequest) {
  if (NEWS_REFRESH_SECRET) {
    const token =
      new URL(req.url).searchParams.get("secret") ||
      req.headers.get("x-news-secret");

    if (token !== NEWS_REFRESH_SECRET) {
      return jsonError("Unauthorized", 401);
    }
  }

  const startedAt = new Date().toISOString();

  let fetched: FetchedStory[] = [];
  try {
    fetched = await fetchApprovedSources();
  } catch (err: any) {
    console.error("[news/scheduled-fetch] fetch failed", err);
    return jsonError("Fetch failure");
  }

  if (!fetched.length) {
    return NextResponse.json({
      ok: true,
      startedAt,
      inserted: 0,
      skipped: 0,
      message: "No approved stories fetched",
    });
  }

  let inserted = 0;
  let skipped = 0;

  for (const item of fetched) {
    const url = normalizeUrl(item.url);

    // Skip if already queued
    const { data: exists } = await supabaseAdmin
      .from("news_backfill_queue")
      .select("id")
      .eq("story_url", url)
      .maybeSingle();

    if (exists) {
      skipped++;
      continue;
    }

    const { error } = await supabaseAdmin
      .from("news_backfill_queue")
      .insert({
        outlet: (() => {
          try {
            return new URL(url).hostname.replace(/^www\./, "");
          } catch {
            return null;
          }
        })(),
        story_url: url,
        source: item.source,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error("[news/scheduled-fetch] insert failed", {
        url,
        error: error.message,
      });
      skipped++;
      continue;
    }

    inserted++;
  }

  return NextResponse.json({
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    fetched: fetched.length,
    inserted,
    skipped,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
