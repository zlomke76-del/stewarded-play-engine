import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userKey } = await req.json();

  if (!userKey) {
    return NextResponse.json(
      { error: "userKey required" },
      { status: 400 }
    );
  }

  // Create a mutable response that Supabase can attach cookies to
  const response = NextResponse.json({});

  // Create a Next.js 16–compatible Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          // Read cookies from the incoming request
          const cookieHeader = req.headers.get("cookie") ?? "";
          const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
          return match?.[1];
        },
        set(name, value, options) {
          // Write cookies to the outgoing response
          response.cookies.set(name, value, options);
        },
        remove(name, options) {
          response.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  // Insert a new conversation
  const { data, error } = await supabase
    .from("chat.conversations")
    .insert({
      user_key: userKey,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Return the same response object so cookies persist
  return NextResponse.json({ conversationId: data.id });
}
