// lib/supabase/server.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient(req: Request, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookieHeader = req.headers.get("cookie") ?? "";
          const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
          return match?.[1];
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}
