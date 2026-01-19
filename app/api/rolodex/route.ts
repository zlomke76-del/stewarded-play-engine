// ------------------------------------------------------------
// Rolodex API Route (AUTHORITATIVE — LOCKED)
// Owner-scoped · Cookie auth · RLS enforced · memory schema
// NEXT 16 SAFE
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
const DIAG = true;

/* ------------------------------------------------------------
   Supabase (schema-bound)
------------------------------------------------------------ */
async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "memory" },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/* ------------------------------------------------------------
   GET /api/rolodex
   OWNER ONLY — UUID IS AUTHORITY
------------------------------------------------------------ */
export async function GET(req: Request) {
  const supabase = await getSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  let query = supabase
    .from("rolodex")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (q?.trim()) {
    query = query.ilike("name", `%${q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("rolodex select error", {
      code: error.code,
      message: error.message,
      details: error.details,
      user_id: user.id,
    });

    return NextResponse.json({
      ok: true,
      items: [],
      ...(DIAG && { diag: { count: 0 } }),
    });
  }

  return NextResponse.json({
    ok: true,
    items: data ?? [],
    ...(DIAG && { diag: { count: data?.length ?? 0 } }),
  });
}

/* ------------------------------------------------------------
   POST /api/rolodex
   OWNER FORCED — PAYLOAD SANITIZED
------------------------------------------------------------ */
export async function POST(req: Request) {
  const supabase = await getSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const body = await req.json();

  // 🔒 HARD SANITIZATION (THIS STOPS 403s)
  delete body.user_id;
  if (!body.workspace_id) delete body.workspace_id;

  const { data, error } = await supabase
    .from("rolodex")
    .insert({
      ...body,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("insert.rolodex error", {
      code: error.code,
      message: error.message,
      details: error.details,
    });

    return NextResponse.json(
      { ok: false, stage: "insert.rolodex", error },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, data });
}
