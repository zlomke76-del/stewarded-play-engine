// app/api/support/list/route.ts
import { NextResponse } from "next/server";

function assertAdmin(req: Request) {
  const hdr = req.headers.get("x-admin-key") || "";
  if (hdr !== process.env.ADMIN_DASH_KEY) throw new Error("Unauthorized");
}

export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // open|in_progress|resolved or null
    const limit = Number(url.searchParams.get("limit") || 100);

    const supa = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const query = new URL(`${supa}/rest/v1/support_requests`);
    query.searchParams.set("select", "id,name,email,category,description,status,created_at");
    query.searchParams.set("order", "created_at.desc");
    query.searchParams.set("limit", String(limit));
    if (status) query.searchParams.set("status", `eq.${status}`);

    const r = await fetch(query, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(await r.text());
    const rows = await r.json();

    return NextResponse.json({ rows });
  } catch (e: any) {
    return new NextResponse(e.message || "Bad Request", { status: e.message === "Unauthorized" ? 401 : 400 });
  }
}
