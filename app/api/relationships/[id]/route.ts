// app/api/relationships/[id]/route.ts
//------------------------------------------------------------
// Relationship fetch — Next.js 16 + @supabase/ssr (FINAL)
//------------------------------------------------------------

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // ⬅️ MUST await in Next.js 16
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore,
    }
  );

  const { data: relationship, error } = await supabase
    .from("memory.relationships")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }

  return NextResponse.json({ relationship });
}
