// app/api/support/auto/route.ts
import { NextResponse } from "next/server";

const SUPA = process.env.SUPABASE_URL!;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const HDRS = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function sendEmail(to: string, subject: string, text: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Moral Clarity Support <support@moralclarity.ai>",
      to,
      subject,
      text,
    }),
  });
  if (!r.ok) console.error("Auto-email failed:", await r.text());
}

function pickTemplate(category: string, description: string) {
  const d = (description || "").toLowerCase();

  if (category === "Billing" && (d.includes("receipt") || d.includes("invoice"))) {
    return {
      subject: "Your receipt request",
      text: `We've resent your latest receipt(s) to this address.  
If you need a company name or VAT number updated, reply with the exact details and date.  
— Steward`,
    };
  }

  if (category === "Account" && (d.includes("email change") || d.includes("update email"))) {
    return {
      subject: "Update your login email",
      text: `To update your login email, reply with both your current and new addresses.  
We'll confirm by sending verification links to each.  
— Steward`,
    };
  }

  if (category === "Technical" && d.includes("login")) {
    return {
      subject: "Sign-in help",
      text: `Use the one-tap sign-in link from our login page.  
If that expires, reply here and we'll issue a manual session.  
— Steward`,
    };
  }

  return null; // fall back to human
}

export async function POST(req: Request) {
  const key = req.headers.get("x-webhook-key");
  if (key !== process.env.SUPA_WEBHOOK_SECRET)
    return new NextResponse("Unauthorized", { status: 401 });

  const payload = await req.json();
  const row = payload?.record;
  if (!row) return NextResponse.json({ ok: true });

  const { id, email, name, category, description } = row;
  const tpl = pickTemplate(category, description);

  if (!tpl) {
    await fetch(`${SUPA}/rest/v1/support_requests?id=eq.${id}`, {
      method: "PATCH",
      headers: HDRS,
      body: JSON.stringify({ status: "in_progress", needs_human: true }),
    });
    return NextResponse.json({ ok: true, action: "escalated" });
  }

  await sendEmail(email, tpl.subject, `Hi ${name || "there"},\n\n${tpl.text}\n`);

  await fetch(`${SUPA}/rest/v1/support_replies`, {
    method: "POST",
    headers: HDRS,
    body: JSON.stringify({
      request_id: id,
      author: "steward",
      body: `(auto) ${tpl.subject}\n\n${tpl.text}`,
    }),
  });

  await fetch(`${SUPA}/rest/v1/support_requests?id=eq.${id}`, {
    method: "PATCH",
    headers: HDRS,
    body: JSON.stringify({ status: "resolved", auto_resolved: true }),
  });

  return NextResponse.json({ ok: true, action: "resolved" });
}
