import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const start = Date.now();

  let supabaseStatus: "ok" | "error" = "ok";
  let errorMessage: string | null = null;

  // Create a mutable response so Supabase can refresh cookies if needed
  const response = NextResponse.json({});

  try {
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

    const { error } = await supabase
      .from("health_check")
      .select("id")
      .limit(1);

    if (error) {
      supabaseStatus = "error";
      errorMessage = error.message;
    }
  } catch (err: any) {
    supabaseStatus = "error";
    errorMessage = err?.message ?? "Unknown error";
  }

  // Return the same response object so cookies persist
  return NextResponse.json(
    {
      uptime_ms: Date.now() - start,
      supabase: supabaseStatus,
      error: errorMessage,
    },
    { status: supabaseStatus === "ok" ? 200 : 500 }
  );
}
