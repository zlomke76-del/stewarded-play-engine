// app/api/support/thread/route.ts
import { NextResponse } from "next/server";

function assertAdmin(req: Request) {
  const hdr = req.headers.get("x-admin-key") || "";
  if (hdr !== process.env.ADMIN_DASH_KEY) throw new Error("Unauthorized");
}

/**
 * GET /api/support/thread?requestId=<uuid>
 * Returns the initial ticket message + all replies (ascending by time).
 */
export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const url = new URL(req.url);
    const requestId = url.searchParams.get("requestId");
    if (!requestId) throw new Error("Missing requestId");

    const supa = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1) Fetch the base ticket
    const tRes = await fetch(
      `${supa}/rest/v1/support_requests?id=eq.${requestId}&select=id,name,email,category,description,created_at,status`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
    );
    if (!tRes.ok) throw new Error(await tRes.text());
    const [ticket] = await tRes.json();
    if (!ticket) throw new Error("Ticket not found");

    // 2) Fetch replies
    const rRes = await fetch(
      `${supa}/rest/v1/support_replies?request_id=eq.${requestId}&select=id,author,body,created_at&order=created_at.asc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
    );
    if (!rRes.ok) throw new Error(await rRes.text());
    const replies = await rRes.json();

    // 3) Build a unified thread (first message is the user's original)
    const thread = [
      {
        id: ticket.id,
        author: ticket.email || "user",
        authorName: ticket.name || null,
        from: "user",
        body: ticket.description as string,
        created_at: ticket.created_at as string,
      },
      ...replies.map((r: any) => ({
        id: r.id,
        author: r.author,
        authorName: r.author === "admin" ? "Support" : r.author,
        from: r.author === "admin" ? "admin" : "user",
        body: r.body,
        created_at: r.created_at,
      })),
    ];

    return NextResponse.json({ ticket, thread });
  } catch (e: any) {
    return new NextResponse(e.message || "Bad Request", {
      status: e.message === "Unauthorized" ? 401 : 400,
    });
  }
}
