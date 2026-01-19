// ------------------------------------------------------------
// Rolodex Workspace Route
// Cookie auth · RLS enforced · memory schema
// Returns personal + workspace contacts (future scope only)
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

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
   GET /api/rolodex/workspace?workspaceId=...
   (OWNER SCOPE ONLY; SHARED CONTACTS DISABLED)
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
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { ok: false, error: "workspaceId is required" },
      { status: 400 }
    );
  }

  // Current model: only show the owner's contacts; workspace_id is a passive tag.
  const { data, error } = await supabase
    .from("rolodex")
    .select("*")
    .eq("user_id", user.id)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("rolodex workspace select error", error);
    return NextResponse.json({ ok: true, items: [] });
  }

  return NextResponse.json({
    ok: true,
    items: data ?? [],
  });
}
