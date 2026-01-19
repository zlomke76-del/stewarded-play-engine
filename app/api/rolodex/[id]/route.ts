// ------------------------------------------------------------
// Rolodex ID Route (PATCH + DELETE)
// Cookie auth · RLS enforced · memory schema
// AUTHORITATIVE ? DEFENSIVE + FINAL
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

/* ----------------------------------------------------------
   Supabase (schema-bound)
----------------------------------------------------------- */
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

/* ----------------------------------------------------------
   Column mapping (UI ? DB)
----------------------------------------------------------- */
const COLUMN_MAP: Record<string, string> = {
  name: "name",
  relationship: "relationship_type",
  relationship_type: "relationship_type",
  email: "primary_email",
  primary_email: "primary_email",
  phone: "primary_phone",
  primary_phone: "primary_phone",
  birthday: "birthday",
  notes: "notes",
  organization: "organization",
  title: "title",
  visibility: "visibility",
  sensitivity_level: "sensitivity_level",
  consent_level: "consent_level",
};

/* ----------------------------------------------------------
   Helper: resolve ID safely
----------------------------------------------------------- */
function resolveId(req: Request, params?: { id?: string }) {
  if (params?.id) return params.id;
  const parts = new URL(req.url).pathname.split("/");
  return parts[parts.length - 1] || null;
}

/* ----------------------------------------------------------
   PATCH /api/rolodex/[id]
----------------------------------------------------------- */
export async function PATCH(
  req: Request,
  { params }: { params: { id?: string } }
) {
  const id = resolveId(req, params);

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Rolodex ID is required" },
      { status: 400 }
    );
  }

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

  // Safe JSON parse
  let body: Record<string, any> = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Strip immutable fields
  delete body.id;
  delete body.user_id;
  delete body.workspace_id;
  delete body.created_at;
  delete body.updated_at;

  // Build update payload
  const updatePayload: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    const column = COLUMN_MAP[key];
    if (!column) continue;

    if (column === "birthday" && typeof value === "string") {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        updatePayload[column] = d.toISOString().slice(0, 10);
      }
      continue;
    }

    if (column === "relationship_type" && typeof value === "string") {
      updatePayload[column] = value.trim().toLowerCase();
      continue;
    }

    updatePayload[column] =
      typeof value === "string" ? value.trim() : value;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const { data, error } = await supabase
    .from("rolodex")
    .update({
      ...updatePayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("update.rolodex error", error);
    return NextResponse.json(
      { ok: false, stage: "update.rolodex", error: error.message },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, data });
}

/* ----------------------------------------------------------
   DELETE /api/rolodex/[id]
----------------------------------------------------------- */
export async function DELETE(
  req: Request,
  { params }: { params: { id?: string } }
) {
  const id = resolveId(req, params);

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Rolodex ID is required" },
      { status: 400 }
    );
  }

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

  const { error } = await supabase
    .from("rolodex")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("delete.rolodex error", error);
    return NextResponse.json(
      { ok: false, stage: "delete.rolodex", error: error.message },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, success: true });
}
