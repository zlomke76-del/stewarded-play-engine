export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  support_request_id: string;
  message: string;
  is_public?: boolean; // default true
};

export async function POST(req: NextRequest): Promise<Response> {
  const { support_request_id, message, is_public = true } = (await req.json()) as Body;

  if (!support_request_id || !message?.trim()) {
    return new Response("Missing support_request_id or message", { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  );

  // 1) Insert message from agent
  const { data: inserted, error } = await supabase
    .from("support_messages")
    .insert({
      support_request_id,
      sender: "agent",
      is_public,
      message,
    })
    .select("*")
    .single();

  if (error) return new Response(error.message, { status: 500 });

  // 2) If public, mark the ticket as open (just in case) and stamp last_public_reply_at
  await supabase
    .from("support_requests")
    .update({
      status: "open",
      last_public_reply_at: is_public ? new Date().toISOString() : null,
    })
    .eq("id", support_request_id);

  // 3) Optional email to the requester (only for public messages)
  if (is_public && process.env.RESEND_API_KEY) {
    const { data: ticket } = await supabase
      .from("support_requests")
      .select("email,title")
      .eq("id", support_request_id)
      .single();

    if (ticket?.email) {
      const html = `
        <p>Hi,</p>
        <p>Our team replied to your ticket: <strong>${ticket.title ?? "Support Request"}</strong></p>
        <blockquote style="border-left:4px solid #e5e7eb;padding-left:12px;color:#374151;">
          ${escapeHtml(message).replace(/\n/g, "<br/>")}
        </blockquote>
        <p>You can reply directly to this email to continue the thread.</p>
        <p>— Moral Clarity AI Support</p>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Moral Clarity AI Support <support@moralclarity.ai>",
          to: [ticket.email],
          subject: "We replied to your support request",
          reply_to: process.env.RESEND_REPLY_TO || "support@moralclarity.ai",
          html,
        }),
      }).catch(() => {});
    }
  }

  return Response.json({ ok: true, message: inserted });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
