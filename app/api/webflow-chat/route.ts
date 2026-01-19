// ------------------------------------------------------------
// Webflow → Solace Adapter (AUTHORITATIVE)
// NO BUSINESS LOGIC
// NO MODEL CALLS
// NON-STREAMING
// ------------------------------------------------------------

import { NextResponse } from "next/server";

export const runtime = "edge";

// ------------------------------------------------------------
// CORS helpers (REQUIRED FOR EDGE)
// ------------------------------------------------------------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ------------------------------------------------------------
// CORS preflight (Webflow-safe)
// ------------------------------------------------------------
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// ------------------------------------------------------------
// Health check
// ------------------------------------------------------------
export async function GET() {
  return NextResponse.json(
    { ok: true, adapter: "webflow-chat" },
    { headers: CORS_HEADERS }
  );
}

// ------------------------------------------------------------
// POST — Adapter only
// ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages = [], filters = [] } = body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          text: "I’m here, but I didn’t receive a message.",
        },
        { headers: CORS_HEADERS }
      );
    }

    // --------------------------------------------------------
    // Extract last USER message only
    // --------------------------------------------------------
    const lastUser = [...messages]
      .reverse()
      .find((m) => m?.role === "user" && typeof m.content === "string");

    if (!lastUser) {
      return NextResponse.json(
        {
          ok: true,
          text: "I’m here. What would you like to explore?",
        },
        { headers: CORS_HEADERS }
      );
    }

    const message = lastUser.content;

    // --------------------------------------------------------
    // Derive mode flags from filters
    // --------------------------------------------------------
    const ministryMode =
      filters.includes("abrahamic") || filters.includes("ministry");

    const modeHint = filters.includes("red")
      ? "red"
      : filters.includes("next")
      ? "next"
      : filters.includes("create")
      ? "create"
      : "";

   // --------------------------------------------------------
// Anonymous, DEMO-STABLE identity
// --------------------------------------------------------
const userKey = "webflow-guest";

// IMPORTANT:
// Demo conversations MUST be stable across turns.
// Do NOT generate a UUID per request.
const conversationId = "demo-webflow-session";


    // --------------------------------------------------------
    // Forward → AUTHORITATIVE SOLACE CHAT API
    // --------------------------------------------------------
    const res = await fetch(
      "https://studio.moralclarity.ai/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId,
          userKey,
          ministryMode,
          founderMode: false,
          modeHint,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[WEBFLOW-ADAPTER] upstream error", errText);

      return NextResponse.json(
        {
          ok: true,
          text: "Sorry — something went wrong.",
        },
        { headers: CORS_HEADERS }
      );
    }

    const data = await res.json();

    const text =
      data?.response ||
      data?.messages?.[0]?.content ||
      "I’m here and ready to continue.";

    // --------------------------------------------------------
    // Return Webflow-compatible response (CORS INCLUDED)
    // --------------------------------------------------------
    return NextResponse.json(
      {
        ok: true,
        text,
      },
      { headers: CORS_HEADERS }
    );

  } catch (err: any) {
    console.error("[WEBFLOW-ADAPTER] fatal", err?.message);

    return NextResponse.json(
      {
        ok: true,
        text: "Sorry — something went wrong.",
      },
      { headers: CORS_HEADERS }
    );
  }
}
