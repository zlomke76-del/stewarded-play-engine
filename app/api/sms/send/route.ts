// ------------------------------------------------------------
// SMS SEND API — AUTHORITATIVE, APPROVAL-GATED
// Server-only outbound messaging via Twilio
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import twilio from "twilio";

// ------------------------------------------------------------
// Runtime config
// ------------------------------------------------------------
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type ApprovedMessage = {
  to: string;
  body: string;
  rolodex_id?: string;
};

type SendRequestBody = {
  approved: boolean;
  messages: ApprovedMessage[];
  reason?: string;
};

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // --------------------------------------------------------
    // RUNTIME ENV VALIDATION (BUILD-SAFE)
    // --------------------------------------------------------
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;

    if (
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY ||
      !SUPABASE_SERVICE_KEY ||
      !TWILIO_SID ||
      !TWILIO_TOKEN ||
      !TWILIO_FROM
    ) {
      console.error("[SMS SEND] Missing required environment variables");
      return NextResponse.json(
        { ok: false, error: "SMS service not configured" },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // Parse request
    // --------------------------------------------------------
    const body: SendRequestBody = await req.json();

    // --------------------------------------------------------
    // HARD APPROVAL GATE
    // --------------------------------------------------------
    if (!body?.approved) {
      return NextResponse.json(
        { ok: false, error: "Explicit approval required" },
        { status: 403 }
      );
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No messages provided" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // USER CONTEXT (RLS-BOUND)
    // --------------------------------------------------------
    const cookieStore = await cookies();

    const supabaseUser = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --------------------------------------------------------
    // SERVICE CLIENT (AUDIT / LOGGING)
    // --------------------------------------------------------
    const supabaseService = createClient(
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
    // TWILIO CLIENT (RUNTIME ONLY)
    // --------------------------------------------------------
    const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);

    // --------------------------------------------------------
    // SEND MESSAGES (SEQUENTIAL, EXPLICIT)
    // --------------------------------------------------------
    const results: any[] = [];

    for (const msg of body.messages) {
      if (!msg.to || !msg.body) continue;

      try {
        const res = await twilioClient.messages.create({
          from: TWILIO_FROM,
          to: msg.to,
          body: msg.body,
        });

        await supabaseService
          .from("outbound_messages")
          .insert({
            user_id: user.id,
            rolodex_id: msg.rolodex_id ?? null,
            channel: "sms",
            to: msg.to,
            body: msg.body,
            provider: "twilio",
            provider_sid: res.sid,
            status: res.status,
            reason: body.reason ?? null,
          } as any);

        results.push({
          to: msg.to,
          sid: res.sid,
          status: res.status,
        });
      } catch (err: any) {
        console.error("[SMS SEND FAILED]", err?.message);
        results.push({
          to: msg.to,
          error: "Send failed",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      sent: results.length,
      results,
    });
  } catch (err: any) {
    console.error("[SMS SEND ROUTE ERROR]", err?.message);
    return NextResponse.json(
      { ok: false, error: "Internal SMS send error" },
      { status: 500 }
    );
  }
}
