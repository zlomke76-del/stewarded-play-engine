import { NextRequest } from "next/server";

const ORIGIN_ALLOW = (process.env.MCAI_WIDGET_ORIGIN ?? "").split(",").map(s => s.trim()).filter(Boolean);
// e.g. MCAI_WIDGET_ORIGIN="https://moralclarityai.webflow.io,https://www.moralclarityai.com"

export const runtime = "edge"; // fast + cheap

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const allow = ORIGIN_ALLOW.includes(origin) ? origin : "";
  return new Response(null, { headers: corsHeaders(allow) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  if (!ORIGIN_ALLOW.includes(origin)) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { messages = [], sessionId } = body as {
    messages: { role: "user"|"assistant"|"system"; content: string }[];
    sessionId?: string;
  };

  // 5-turn demo limit (user messages only)
  const turnCount = messages.filter(m => m.role === "user").length;
  if (turnCount > 5) {
    return Response.json({
      error: "limit",
      message: "Free demo limit reached. Upgrade for memory & uploads."
    }, { headers: corsHeaders(origin) });
  }

  // Our guardrails system prompt
  const SYSTEM = `
You are Moral Clarity AI. Respond with:
- TRUTH: source-aware, avoid speculation.
- NEUTRALITY: show trade-offs fairly.
- CLARITY: be concise and actionable.
No partisan takes; cite uncertainty plainly. Keep answers <= 220 words unless asked for depth.`;

  // Compose payload
  const chat = [
    { role: "system", content: SYSTEM },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  // Call OpenAI (server-side only)
  const apiKey = process.env.OPENAI_API_KEY!;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini", // fast/cheap; swap if you prefer
      messages: chat,
      temperature: 0.4,
    })
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    return new Response(`Upstream error: ${t}`, { status: 500, headers: corsHeaders(origin) });
  }

  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn’t generate a reply.";

  return Response.json({ reply: text }, { headers: corsHeaders(origin) });
}
