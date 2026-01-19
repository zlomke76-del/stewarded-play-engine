// app/api/explain/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { memory_id } = await req.json();

  if (!memory_id) {
    return NextResponse.json(
      { error: "memory_id required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_memories")
    .select("metadata->explanation")
    .eq("id", memory_id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    explanation: data?.explanation ?? null,
  });
}
