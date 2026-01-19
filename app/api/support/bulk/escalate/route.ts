export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

export async function POST(): Promise<Response> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // server-only
  );

  const { error } = await supabase
    .from("support_requests")
    .update({ priority: "high" })
    .eq("status", "open")
    .neq("priority", "high");

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
}
