export const runtime = "nodejs";
// Mark as a module and keep Next from statically optimizing this
export const dynamic = "force-dynamic";

// Types for the incoming payload (shallow, keep it flexible)
type Row = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
};

// POST /api/hooks/support-created
export async function POST(req: Request): Promise<Response> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY!;
  const RESEND_FROM = process.env.RESEND_FROM || "Support <support@moralclarity.ai>";
  const SUPPORT_TEAM_EMAIL = process.env.SUPPORT_TEAM_EMAIL || "zlomke76@gmail.com";
  const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET!;

  // Simple static-secret check (Supabase DB Webhooks send this header)
  const sig =
    req.headers.get("x-webhook-signature") ||
    req.headers.get("supabase-signature");

  if (!sig || sig !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const row = body?.record as Row | undefined;
  if (!row) return new Response("No record", { status: 400 });

  const created = new Date(row.created_at).toLocaleString();

  const adminHtml = `
    <h2>New Support Request</h2>
    <p><strong>When:</strong> ${created}</p>
    <p><strong>Name:</strong> ${row.name || "—"}</p>
    <p><strong>Email:</strong> ${row.email || "—"}</p>
    <p><strong>Category:</strong> ${row.category}</p>
    <p><strong>Title:</strong> ${row.title}</p>
    <p><strong>Description:</strong><br/>${(row.description || "").replace(/\n/g,"<br/>")}</p>
    <p><strong>Status:</strong> ${row.status} &nbsp; <strong>Priority:</strong> ${row.priority}</p>
    <p><small>Ticket ID: ${row.id}</small></p>
  `;

  const userHtml = `
    <p>Hi ${row.name || "there"},</p>
    <p>We received your request:</p>
    <blockquote>
      <strong>${row.title}</strong><br/>
      ${(row.description || "").replace(/\n/g,"<br/>")}
    </blockquote>
    <p>We’ll get back to you shortly. If you need to add details, just reply to this email.</p>
    <p>— Moral Clarity AI Support</p>
  `;

  const send = (to: string, subject: string, html: string, replyTo?: string) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to,
        subject,
        html,
        reply_to: replyTo || "support@moralclarity.ai",
      }),
    });

  const tasks: Promise<Response>[] = [];
  tasks.push(send(SUPPORT_TEAM_EMAIL, `New ticket: ${row.category} • ${row.title}`, adminHtml, row.email || undefined));
  if (row.email) {
    tasks.push(send(row.email, `We received your request: ${row.title}`, userHtml, "support@moralclarity.ai"));
  }

  const results = await Promise.all(tasks);
  const ok = results.every(r => r.ok);
  if (!ok) {
    const texts = await Promise.all(results.map(r => r.text()));
    console.error("Resend error:", texts);
  }

  return Response.json({ ok: true });
}
