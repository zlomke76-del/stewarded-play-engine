import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await client
    .from("outlet_neutrality_aggregates")
    .select("*")
    .order("story_count", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    updated_at: new Date().toISOString(),
    outlets: data
  });
}
