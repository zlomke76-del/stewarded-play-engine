export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { buildVisionSystemPrompt } from "@/lib/solace/vision-mode";
import { getSolaceFeatureFlags } from "@/lib/solace/settings";

// Resolve model flexibly
const SOLACE_VISION_MODEL =
  process.env.OPENAI_RESPONSE_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4.1";

function jsonError(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // --------------------------------------------------
    // Feature flag gate
    // --------------------------------------------------
    const flags = getSolaceFeatureFlags();
    if (!flags.visionEnabled) {
      return jsonError("Vision access for Solace is disabled.", 403, {
        code: "VISION_DISABLED",
      });
    }

    // --------------------------------------------------
    // Parse request body
    // --------------------------------------------------
    const body = (await req.json().catch(() => null)) as
      | { url?: string; imageUrl?: string; prompt?: string }
      | null;

    const imageUrl = (body?.imageUrl || body?.url || "").trim();
    const userPrompt =
      body?.prompt?.trim() ||
      "Describe what you can safely see and offer practical, nonjudgmental help.";

    if (!imageUrl) {
      return jsonError("Missing image URL in request body.", 400, {
        code: "NO_IMAGE_URL",
      });
    }

    // --------------------------------------------------
    // HARD VALIDATION — OpenAI requires public HTTP(S)
    // --------------------------------------------------
    const isHttpUrl =
      imageUrl.startsWith("http://") || imageUrl.startsWith("https://");

    if (!isHttpUrl) {
      return jsonError(
        "Image must be a publicly accessible HTTPS URL. Data URLs and local blobs are not supported.",
        400,
        { code: "INVALID_IMAGE_URL_FORMAT" }
      );
    }

    // --------------------------------------------------
    // Build system prompt
    // --------------------------------------------------
    const system = buildVisionSystemPrompt(`
You must follow Solace's VISION SAFETY & INTERPRETATION PROTOCOL.

If the image appears to contain restricted content (nudity, explicit sexual content,
graphic violence, criminal activity, weapons, drugs, extremist symbolism, or minors
in unsafe situations), respond ONLY with:

"I can’t assist with this image because it contains restricted visual content. If you’d like to describe the situation in words, I can help that way."

Otherwise:
- Briefly describe what is visible.
- Offer 2–3 practical, nonjudgmental suggestions if appropriate.
- Stay calm, kind, and non-shaming.
    `.trim());

    const openai = await getOpenAI();

    // --------------------------------------------------
    // OpenAI Responses API call
    // NOTE: `detail` is REQUIRED for input_image
    // --------------------------------------------------
    const resp = await openai.responses.create({
      model: SOLACE_VISION_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: system,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userPrompt,
            },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "auto",
            },
          ],
        },
      ],
      max_output_tokens: 900,
    });

    return NextResponse.json({
      ok: true,
      answer: resp.output_text ?? "",
      model: SOLACE_VISION_MODEL,
    });
  } catch (err: any) {
    console.error("[solace/vision] fatal error", err);
    return jsonError(
      err?.message || "Unexpected error in Solace vision route.",
      500,
      { code: "SOLACE_VISION_FATAL" }
    );
  }
}

export async function GET() {
  return jsonError("Use POST with JSON body.", 405, {
    code: "METHOD_NOT_ALLOWED",
  });
}
