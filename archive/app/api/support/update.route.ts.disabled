import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

export async function PATCH(req: NextRequest) {
  const { id, field, value } = await req.json();
  if (!id || !["status","priority"].includes(field)) {
    return new NextResponse("Invalid payload", { status: 400 });
  }
  const { error } = await supabase
    .from("support_requests")
    .update({ [field]: value })
    .eq("id", id);
  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}
