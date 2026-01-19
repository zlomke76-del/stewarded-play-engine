// app/api/memory/workspace/route.ts
// ------------------------------------------------------------
// Workspace Memory Read Route
// SSR · Cookie auth · RLS enforced · memory schema
// AUTHORITATIVE READ PATH
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

/* ------------------------------------------------------------
   Supabase (schema-bound, cookie auth)
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
   GET /api/memory/workspace
------------------------------------------------------------ */
export async function GET(req: Request) {
  const supabase = await getSupabase();

  /* ----------------------------------------------------------
     Auth
  ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     Query params
  ---------------------------------------------------------- */
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { ok: false, error: "workspaceId is required" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------------
     AUTHORITATIVE MEMORY QUERY
     User-owned fact memories only
  ---------------------------------------------------------- */
  const { data: items, error } = await supabase
    .from("memories")
    .select(`
      id,
      user_id,
      email,
      workspace_id,
      memory_type,
      source,
      content,
      weight,
      confidence,
      sensitivity,
      emotional_weight,
      is_active,
      metadata,
      promoted_at,
      conversation_id,
      created_at,
      updated_at
    `)
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .eq("memory_type", "fact")
    .neq("source", "system")
    .neq("email", "system")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("workspace.memory.read error", error);
    return NextResponse.json(
      { ok: false, stage: "memory.read", error: error.message },
      { status: 403 }
    );
  }

  return NextResponse.json({ items: items ?? [] });
}
