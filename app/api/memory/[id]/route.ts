// app/api/memory/[id]/route.ts
// ------------------------------------------------------------
// Memory ID Route (PATCH + DELETE)
// SSR · Cookie auth · RLS enforced · memory schema
// AUTHORITATIVE MUTATION PATH
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
   Utility: robust ID extraction
   (guards against App Router param binding failures)
------------------------------------------------------------ */
function extractId(
  req: Request,
  params?: { id?: string }
): string | null {
  if (params?.id) return params.id;

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last !== "memory") return last;
  } catch {
    /* noop */
  }

  return null;
}

/* ------------------------------------------------------------
   PATCH /api/memory/[id]
   Explicit content update only
------------------------------------------------------------ */
export async function PATCH(
  req: Request,
  context: { params?: { id?: string } }
) {
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
     ID resolution (robust)
  ---------------------------------------------------------- */
  const memoryId = extractId(req, context.params);

  if (!memoryId) {
    console.error("PATCH memory: id missing", {
      url: req.url,
      params: context.params,
    });

    return NextResponse.json(
      { ok: false, error: "Memory ID is required" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------------
     Parse JSON
  ---------------------------------------------------------- */
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!("content" in body)) {
    return NextResponse.json(
      { ok: false, error: "content is required" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------------
     Update memory (RLS enforced)
  ---------------------------------------------------------- */
  const { data, error } = await supabase
    .from("memories")
    .update({
      content: body.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memoryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("update.memory error", error);
    return NextResponse.json(
      { ok: false, stage: "update.memory", error: error.message },
      { status: 403 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Memory not found or not owned by user" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

/* ------------------------------------------------------------
   DELETE /api/memory/[id]
   Owner only · irreversible
------------------------------------------------------------ */
export async function DELETE(
  req: Request,
  context: { params?: { id?: string } }
) {
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
     ID resolution (robust)
  ---------------------------------------------------------- */
  const memoryId = extractId(req, context.params);

  if (!memoryId) {
    console.error("DELETE memory: id missing", {
      url: req.url,
      params: context.params,
    });

    return NextResponse.json(
      { ok: false, error: "Memory ID is required" },
      { status: 400 }
    );
  }

  /* ----------------------------------------------------------
     Delete memory (RLS enforced, ensure actual deletion)
  ---------------------------------------------------------- */
  const { error, count } = await supabase
    .from("memories")
    .delete({ count: "exact" }) // <--- Key fix: Request row count
    .eq("id", memoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("delete.memory error", error);
    return NextResponse.json(
      { ok: false, stage: "delete.memory", error: error.message },
      { status: 403 }
    );
  }

  if (!count || count === 0) {
    return NextResponse.json(
      { ok: false, error: "Memory not found or not owned by user" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, deleted: true });
}
