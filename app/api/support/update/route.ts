// app/api/support/update/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Handle missing env vars gracefully
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase env vars in /api/support/update");
    return new Response("Missing Supabase env", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Your existing logic here
  return new Response("ok");
}
