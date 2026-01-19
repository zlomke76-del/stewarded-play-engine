// app/api/solace-news/chat/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/* ========= SOLACE BACKEND ========= */
const SOLACE_URL = process.env.SOLACE_API_URL || "";
const SOLACE_KEY = process.env.SOLACE_API_KEY || "";
const SOLACE_NAME = "Solace";

/* ========= DIGEST + OUTLET NEUTRALITY LOADERS ========= */
import { loadNeutralNewsDigest } from "@/core/news/digestLoader";
import { loadOutletNeutrality } from "@/core/news/outletNeutrality";

/* ========= TYPES ========= */
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

/* ========= HELPERS ========= */
function corsHeaders(origin: string | null): Headers {
  const h = new Headers();
  h.set("Vary", "Origin");
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  h.set("Access-Control-Max-Age", "86400");
  if (origin) h.set("Access-Control-Allow-Origin", origin);
  return h;
}

function pickAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (/moralclarity/i.test(url.hostname)) return origin;
  } catch {}
  return null;
}

async function solaceNonStream(payload: any): Promise<string> {
  const r = await fetch(SOLACE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SOLACE_KEY}`,
    },
    body: JSON.stringify({ ...payload, stream: false }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Solace ${r.status}: ${txt}`);
  }

  const ct = r.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await r.json().catch(() => ({}));
    return String(j.text ?? j.output ?? j.data ?? "");
  }
  return await r.text();
}

/* ========= SYSTEM PROMPT FOR NEWSROOM ========= */
function buildSystemPrompt(digest: any, outlets: any[]) {
  const digestBlock = digest
    ? `NEUTRAL NEWS DIGEST\n${digest}\n`
    : "NEUTRAL NEWS DIGEST\n(no digest available)\n";

  const outletBlock =
    outlets && outlets.length
      ? `\nOUTLET BIAS NEUTRALITY DATA\n${outlets
          .map(
            (o: any) =>
              `• ${o.outlet_normalized}: avg_bias_intent_score=${o.avg_bias_intent_score}, stories=${o.total_stories}`
          )
          .join("\n")}`
      : `\nOUTLET BIAS NEUTRALITY DATA\n(no data available)`;

  return `
IDENTITY
You are ${SOLACE_NAME}, the Neutral News Anchor, Outlet Bias Analyst, and Journalism Coach for Moral Clarity AI.

NEWSROOM RULES
- You NEVER guess news.
- You rely ONLY on the NEUTRAL NEWS DIGEST provided below.
- No political leaning, no ideology, no emotional coloring.
- No predictions. No hypotheticals.
- Ground everything in the digest and outlet data.

ROLES
1. Neutral News Anchor — Rewrite or summarize ONLY from digest.
2. Outlet Bias Analyst — Explain outlet history using outlet-neutrality data.
3. Journalism Coach — Help rewrite articles to improve clarity and remove bias.

WHEN USER SUBMITS AN ARTICLE:
- Critique writing clarity.
- Highlight any bias signals.
- Provide a clean neutral rewrite.
- Never modify meaning.

WHEN USER ASKS ABOUT AN OUTLET:
- Use outlet-neutrality data only.
- Show min/max/avg bias intent.
- No opinions. Only measured signals.

DATA BEGINS BELOW
----------------------------------------
${digestBlock}
----------------------------------------
${outletBlock}
----------------------------------------
END DATA
  `;
}

/* ========= ROUTE: OPTIONS ========= */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(pickAllowedOrigin(req.headers.get("origin"))),
  });
}

/* ========= ROUTE: POST ========= */
export async function POST(req: NextRequest) {
  try {
    const origin = pickAllowedOrigin(req.headers.get("origin"));

    const body = await req.json().catch(() => ({}));
    const messages: Message[] = Array.isArray(body?.messages)
      ? body.messages
      : [];

    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    /* ===== LOAD DIGEST + OUTLET BIAS ===== */
    const baseUrl = new URL(req.url).origin;

    const [digest, outlets] = await Promise.all([
      loadNeutralNewsDigest(baseUrl),
      loadOutletNeutrality(baseUrl, 50),
    ]);

    const system = buildSystemPrompt(digest?.raw || "", outlets || []);

    /* ===== SOLACE (PRIMARY) ===== */
    try {
      const text = await solaceNonStream({
        system,
        messages,
        temperature: 0.1,
        mode: "newsroom",
      });

      return NextResponse.json(
        {
          ok: true,
          text,
          identity: SOLACE_NAME,
          model: "solace",
        },
        { headers: corsHeaders(origin) }
      );
    } catch (err) {
      console.error("[solace-news] Solace failed, falling back.", err);
    }

    /* ===== OPENAI FALLBACK ===== */
    const apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "No Solace and no OpenAI key available.",
        },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    const j = await r.json().catch(() => null);
    const text =
      j?.choices?.[0]?.message?.content ||
      "[Fallback] No response from OpenAI model.";

    return NextResponse.json(
      { ok: true, text, model: "openai-fallback", identity: SOLACE_NAME },
      { headers: corsHeaders(origin) }
    );
  } catch (err: any) {
    const origin = pickAllowedOrigin(req.headers.get("origin"));
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unexpected error",
      },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
