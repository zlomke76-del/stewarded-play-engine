// app/api/whoami/route.ts
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // tiny helper to read a cookie value from the incoming request
  const readCookie = (cookieHeader: string | null, key: string): string | undefined => {
    if (!cookieHeader) return undefined;
    const match = cookieHeader.match(new RegExp(`${key}=([^;]+)`));
    return match?.[1];
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          return readCookie(req.headers.get("cookie"), name);
        },
        set(_name: string, _value: string, _options: CookieOptions): void {
          // no-op for this diagnostic route
        },
        remove(_name: string, _options: CookieOptions): void {
          // no-op for this diagnostic route
        },
      } as any,
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const projectRef =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/(.+?)\.supabase\.co$/)?.[1] ?? null;

  return NextResponse.json({
    projectRef,
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
  });
}
