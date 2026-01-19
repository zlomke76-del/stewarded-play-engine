export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  try {
    // ✅ Stable cookie extraction (no async cookies() API)
    const cookieHeader = req.headers.get("cookie") ?? "";

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const match = cookieHeader
              .split(";")
              .map(c => c.trim())
              .find(c => c.startsWith(name + "="));
            return match ? match.split("=")[1] : undefined;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data, error } = await supabase
      .schema("research")
      .from("hubble_ingest_v1")
      .select("*")
      .order("timestamp_utc", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[HUBBLE READ ERROR]", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      count: data?.length ?? 0,
      events: data ?? [],
    });
  } catch (err: any) {
    console.error("[HUBBLE EVENTS FATAL]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
