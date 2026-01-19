export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const NEWS_REFRESH_SECRET = process.env.NEWS_REFRESH_SECRET || "";

// 🔒 Canonical production ingest worker endpoint
const INGEST_WORKER_URL =
  "https://studio.moralclarity.ai/api/news/ingest-worker";

function corsHeaders(origin: string | null): Headers {
  const h = new Headers();
  h.set("Vary", "Origin");
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Access-Control-Max-Age", "86400");
  if (origin) h.set("Access-Control-Allow-Origin", origin);
  return h;
}

function pickOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  try {
    const u = new URL(origin);
    if (
      u.hostname.endsWith("moralclarity.ai") ||
      u.hostname.endsWith("moralclarityai.com") ||
      u.hostname === "localhost"
    ) {
      return origin;
    }
  } catch {}

  return null;
}

async function handleRefresh(req: NextRequest) {
  const origin = pickOrigin(req);

  if (NEWS_REFRESH_SECRET) {
    const url = new URL(req.url);
    const token =
      url.searchParams.get("secret") || req.headers.get("x-news-secret");

    if (token !== NEWS_REFRESH_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401, headers: corsHeaders(origin) }
      );
    }
  }

  let workerResult: any = null;

  try {
    const workerResponse = await fetch(INGEST_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(NEWS_REFRESH_SECRET
          ? { "x-news-secret": NEWS_REFRESH_SECRET }
          : {}),
      },
    });

    if (!workerResponse.ok) {
      const text = await workerResponse.text();
      throw new Error(
        `Ingest worker failed (${workerResponse.status}): ${text}`
      );
    }

    workerResult = await workerResponse.json();
  } catch (err: any) {
    console.error("[news/refresh] ingest-worker invocation failed", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Ingest worker invocation failed",
        message: err?.message || String(err),
      },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      status: "refresh_completed",
      worker: workerResult,
    },
    { status: 200, headers: corsHeaders(origin) }
  );
}

export async function GET(req: NextRequest) {
  return handleRefresh(req);
}

export async function POST(req: NextRequest) {
  return handleRefresh(req);
}

export async function OPTIONS(req: NextRequest) {
  const origin = pickOrigin(req);
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
