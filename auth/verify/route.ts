import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/sign-in`);
  }

  // 🔑 Next.js 16: cookies() IS ASYNC
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  // Manually exchange the code if cookies failed
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/verify] manual code exchange failed", error);
    return NextResponse.redirect(`${origin}/auth/sign-in`);
  }

  // Set session cookies manually
  cookieStore.set({
    name: "sb-access-token",
    value: "access-token-value", // replace with real token value
    maxAge: 3600, // Set a 1-hour expiry, adjust as needed
  });

  return NextResponse.redirect(`${origin}/app`);
}
