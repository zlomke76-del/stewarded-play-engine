/* app/api/admin/init-workspace-keys/route.ts */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initWorkspaceKey } from "@/lib/memory-utils";

export const runtime = "nodejs";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase env (URL or SERVICE_ROLE)" },
      { status: 500 }
    );
  }

  // Admin client for server-side insert/select into mca.workspace_keys
  const supabase = createClient(url, service, { auth: { persistSession: false } });

  // Use a deterministic workspace id for first run; override via env if desired.
  const workspaceId = process.env.MCA_WORKSPACE_ID || "diagnostic";
  try {
    const ref = await initWorkspaceKey(supabase as any, workspaceId);
    return NextResponse.json({ ok: true, ref });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
