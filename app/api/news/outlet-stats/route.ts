import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const outlet = searchParams.get("outlet");

  if (!outlet) {
    return NextResponse.json(
      { ok: false, error: "Missing outlet parameter" },
      { status: 400 }
    );
  }

  // Create a mutable response so Supabase can refresh cookies if needed
  const response = NextResponse.json({});

  // Next.js 16–compatible Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          const cookieHeader = req.headers.get("cookie") ?? "";
          const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
          return match?.[1];
        },
        set(name, value, options) {
          response.cookies.set(name, value, options);
        },
        remove(name, options) {
          response.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data, error } = await supabase
    .from("outlet_bias_pi_overview")
    .select(`
      outlet,
      total_stories,
      days_active,
      last_story_day,
      avg_bias_intent_weighted,
      avg_pi_weighted,
      avg_bias_language_weighted,
      avg_bias_source_weighted,
      avg_bias_framing_weighted,
      avg_bias_context_weighted
    `)
    .eq("outlet", outlet)
    .maybeSingle();

  if (error) {
    console.error("API error at /api/news/outlet-stats", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }

  // Return the same response so any refreshed cookies persist
  return NextResponse.json({
    ok: true,
    outlet: data ?? null,
  });
}
