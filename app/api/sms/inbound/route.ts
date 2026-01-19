// ------------------------------------------------------------
// Inbound SMS Webhook (Twilio → Solace)
// Authoritative, Read-Only, Approval-Gated
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ------------------------------------------------------------
// Runtime config
// ------------------------------------------------------------
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ------------------------------------------------------------
// Helpers — Twilio signature verification
// ------------------------------------------------------------
function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
  authToken: string
): boolean {
  if (!signature) return false;

  const sortedKeys = Object.keys(params).sort();
  const data =
    url +
    sortedKeys.map((key) => `${key}${params[key]}`).join("");

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signature);

  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

// ------------------------------------------------------------
// POST handler
// ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // --------------------------------------------------------
    // ENV VALIDATION (RUNTIME, NOT BUILD-TIME)
    // --------------------------------------------------------
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TWILIO_TOKEN) {
      console.error("[SMS INBOUND] Missing required env vars");
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    // --------------------------------------------------------
    // Parse inbound request
    // --------------------------------------------------------
    const url = req.url;
    const bodyText = await req.text();
    const form = Object.fromEntries(
      new URLSearchParams(bodyText)
    ) as Record<string, string>;

    const twilioSignature =
      req.headers.get("x-twilio-signature");

    // --------------------------------------------------------
    // SECURITY — Verify Twilio signature
    // --------------------------------------------------------
    const verified = verifyTwilioSignature(
      url,
      form,
      twilioSignature,
      TWILIO_TOKEN
    );

    if (!verified) {
      console.error("[SMS INBOUND] Invalid Twilio signature");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { From, To, Body, MessageSid } = form;

    if (!From || !Body) {
      return NextResponse.json({ ok: true });
    }

    // --------------------------------------------------------
    // Admin client (RLS bypass, server-only)
    // --------------------------------------------------------
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // --------------------------------------------------------
    // Resolve sender → Rolodex
    // --------------------------------------------------------
    const { data: contact } = await supabase
      .from("rolodex")
      .select("id, name")
      .eq("primary_phone", From)
      .single();

    // --------------------------------------------------------
    // Write inbound message (NO automation)
    // --------------------------------------------------------
    await supabase
      .from("working_memory")
      .insert({
        role: "system",
        content: JSON.stringify({
          type: "sms_inbound",
          from: From,
          to: To,
          body: Body,
          message_sid: MessageSid,
          contact: contact
            ? {
                id: contact.id,
                name: contact.name,
              }
            : null,
        }),
      } as any);

    console.log("[SMS INBOUND]", {
      from: From,
      contact: contact?.name ?? "unknown",
      body: Body,
    });

    // --------------------------------------------------------
    // IMPORTANT:
    // - No auto-reply
    // - No TwiML
    // - Human approval required
    // --------------------------------------------------------
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[SMS INBOUND ERROR]", err);
    return NextResponse.json({ ok: true });
  }
}
