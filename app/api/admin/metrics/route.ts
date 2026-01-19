export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// app/api/admin/metrics/route.ts
import { NextResponse } from "next/server";

function assertAdmin(req: Request) {
  const hdr = req.headers.get("x-admin-key") || "";
  if (hdr !== process.env.ADMIN_DASH_KEY) throw new Error("Unauthorized");
}

export async function GET(req: Request) {
  try {
    assertAdmin(req);

    const SUPA = process.env.SUPABASE_URL!;
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!SUPA || !KEY) throw new Error("Missing Supabase env vars");
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

    // ---- helpers ----------------------------------------------------------
    const countByStatus = async (status: string): Promise<number> => {
      const url = new URL(`${SUPA}/rest/v1/support_requests`);
      url.searchParams.set("select", "id");
      url.searchParams.set("status", `eq.${status}`);
      const r = await fetch(url, {
        headers: { ...headers, Prefer: "count=exact" },
        cache: "no-store",
      });
      if (!r.ok) throw new Error(await r.text());
      return Number(r.headers.get("content-range")?.split("/")[1] || "0");
    };

    // ---- counts -----------------------------------------------------------
    const [open, inprog, resolved] = await Promise.all([
      countByStatus("open"),
      countByStatus("in_progress"),
      countByStatus("resolved"),
    ]);

    // last 7 days created
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentUrl = new URL(`${SUPA}/rest/v1/support_requests`);
    recentUrl.searchParams.set("select", "id");
    recentUrl.searchParams.set("created_at", `gte.${since}`);
    const recentRes = await fetch(recentUrl, {
      headers: { ...headers, Prefer: "count=exact" },
      cache: "no-store",
    });
    if (!recentRes.ok) throw new Error(await recentRes.text());
    const last7 = Number(recentRes.headers.get("content-range")?.split("/")[1] || "0");

    // latest 10 tickets
    const listUrl = new URL(`${SUPA}/rest/v1/support_requests`);
    listUrl.searchParams.set(
      "select",
      "id,name,email,category,status,created_at,description"
    );
    listUrl.searchParams.set("order", "created_at.desc");
    listUrl.searchParams.set("limit", "10");
    const latestRes = await fetch(listUrl, { headers, cache: "no-store" });
    if (!latestRes.ok) throw new Error(await latestRes.text());
    const latest = await latestRes.json();

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      support: { open, in_progress: inprog, resolved, last7, latest },
      env: {
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        SUPPORT_INBOX: !!process.env.SUPPORT_INBOX,
        APP_BASE_URL: !!process.env.APP_BASE_URL,
      },
    });
  } catch (e: any) {
    const code = e?.message === "Unauthorized" ? 401 : 400;
    return new NextResponse(e?.message || "Bad Request", { status: code });
  }
}
