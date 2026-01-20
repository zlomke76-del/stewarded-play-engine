// app/(protected)/api/resolve/route.ts

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const res = NextResponse.next();

  // ✅ Use the Solace canonical helper
  const supabase = createSupabaseServerClient(req, res);

  // 🔐 Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ---- route logic continues here ----
  return NextResponse.json({ ok: true });
}
