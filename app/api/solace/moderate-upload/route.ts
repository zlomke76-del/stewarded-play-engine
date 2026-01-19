// app/api/solace/moderate-upload/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getSolaceFeatureFlags } from "@/lib/solace/settings";

function jsonError(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/**
 * Generic moderation endpoint for text + (optionally) filenames.
 *
 * Body (JSON):
 * {
 *   "text": "user-provided description or extracted content",
 *   "filename": "optional original filename"
 * }
 *
 * You can use it before storing uploads, adding a simple safety gate.
 */
type ModerateBody = {
  text: string;
  filename?: string;
};

export async function POST(req: NextRequest) {
  try {
    const flags = getSolaceFeatureFlags();
    if (!flags.uploadModerationEnabled) {
      return jsonError("Upload moderation is disabled.", 403, {
        code: "UPLOAD_MOD_DISABLED",
      });
    }

    const body = (await req.json().catch(() => null)) as ModerateBody | null;
    if (!body || !body.text?.trim()) {
      return jsonError("Missing 'text' in body.", 400, { code: "BAD_REQUEST" });
    }

    const openai = await getOpenAI();

    const systemPrompt = `
You are an upload safety gatekeeper for Moral Clarity AI.

You receive:
- TEXT_CONTENT: description or extracted text from an upload.
- FILENAME: optional filename.

Your task:
- Determine whether this upload is ALLOWED or REJECTED based on safety:
  - REJECT if it appears to contain:
    - explicit sexual content (especially involving minors),
    - graphic violence or gore,
    - instructions for serious harm, terrorism, or crime,
    - hateful or extremist propaganda.
  - Otherwise ALLOW.

Return ONLY JSON:

{
  "decision": "ALLOW" | "REJECT",
  "reasons": ["short reason 1", "short reason 2", "..."]
}
    `.trim();

    const userContent = `
FILENAME: ${body.filename || "(none)"}

TEXT_CONTENT:
${body.text}
    `.trim();

    // Match the pattern you already use elsewhere: single string input.
    const resp = await openai.responses.create({
      model: "gpt-4.1-mini", // cheap safety helper; adjust if you want
      input: `${systemPrompt}\n\n${userContent}`,
      max_output_tokens: 300,
    });

    const raw = (resp as any).output_text as string | undefined;
    let parsed: { decision: "ALLOW" | "REJECT"; reasons: string[] } | null =
      null;

    if (raw) {
      try {
        const cleaned = raw
          .trim()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.warn("[solace/moderate-upload] parse error, raw:", raw);
      }
    }

    if (!parsed || !parsed.decision) {
      // Fail-safe: if we can't parse, be conservative.
      return NextResponse.json({
        ok: true,
        decision: "REJECT",
        reasons: ["Unable to parse moderation result safely."],
      });
    }

    return NextResponse.json({
      ok: true,
      decision: parsed.decision,
      reasons: parsed.reasons || [],
    });
  } catch (err: any) {
    console.error("[solace/moderate-upload] fatal error", err);
    return jsonError(
      err?.message || "Unexpected error in upload moderation route.",
      500,
      { code: "UPLOAD_MOD_FATAL" }
    );
  }
}

export async function GET() {
  return jsonError("Use POST with JSON body.", 405, {
    code: "METHOD_NOT_ALLOWED",
  });
}
