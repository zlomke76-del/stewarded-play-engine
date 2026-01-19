// app/api/logo/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const CLEARBIT_BASE = "https://logo.clearbit.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return new NextResponse("Missing domain", { status: 400 });
  }

  try {
    const upstream = await fetch(`${CLEARBIT_BASE}/${domain}`, {
      // Important: Clearbit is sensitive to headers
      headers: {
        "User-Agent": "MoralClarityAI/1.0 (logo proxy)",
        Accept: "image/*",
      },
      // Prevent Next from caching the *fetch* — we control caching via headers
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new NextResponse("Logo not found", { status: 404 });
    }

    const contentType =
      upstream.headers.get("content-type") ?? "image/png";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,

        // ✅ Cache at CDN + browser level
        // 30 days immutable is safe for logos
        "Cache-Control": "public, max-age=2592000, immutable",
      },
    });
  } catch (err) {
    console.error("[logo proxy] fetch failed", err);
    return new NextResponse("Logo fetch failed", { status: 502 });
  }
}
