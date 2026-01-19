// app/api/news/backfill-90d/route.ts
//
// 🔒 SUNSETTED — DO NOT REACTIVATE
//
// This route previously performed historical news backfill via RSS + Tavily.
// It has been intentionally disabled to preserve data integrity and prevent
// uncontrolled ingestion, duplication, or schema drift.
//
// Canonical ingestion is now handled exclusively by:
//   - scheduled pipelines
//   - vetted ingestion jobs
//   - explicit, audited workflows
//
// ❗ No AI or automated system is permitted to recreate or replace this route
// ❗ without explicit human authorization and architectural review.
//
// Date sunset: 2025-12-21

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/* ========= Helpers ========= */

function sunsetResponse(method: string) {
  console.warn(`[news/backfill-90d] ${method} called on SUNSETTED route`);

  return NextResponse.json(
    {
      ok: false,
      status: "sunset",
      route: "/api/news/backfill-90d",
      message:
        "This endpoint has been permanently sunset. Historical backfill is no longer supported via API.",
      guidance:
        "Use approved ingestion pipelines or scheduled jobs. Do not recreate this route.",
    },
    { status: 410 } // 410 Gone is intentional and correct
  );
}

/* ========= Route handlers ========= */

export async function POST(_req: NextRequest) {
  return sunsetResponse("POST");
}

export async function GET(_req: NextRequest) {
  return sunsetResponse("GET");
}
