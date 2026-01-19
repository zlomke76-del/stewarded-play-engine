export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractTextFromBuffer } from "@/core/newsroom/coach/extract";
import { buildCritiquePrompt } from "@/core/newsroom/coach/critique";
import { rubricSchema } from "@/core/newsroom/coach/rubric";
import type OpenAI from "openai";

import { getOpenAI } from "@/lib/openai";

/* ==== SOLACE BACKEND CONFIG ==== */
const SOLACE_URL = process.env.SOLACE_API_URL || "";
const SOLACE_KEY = process.env.SOLACE_API_KEY || "";

/* ==== SUPABASE ADMIN ==== */
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function cors() {
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  return h;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400, headers: cors() }
      );
    }

    /* === Parse form === */
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const mode = String(form.get("mode") || "critique");

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400, headers: cors() }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;

    /* === Upload to Supabase (moralclarity_uploads bucket) === */
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE);
    const path = `newsroom/${Date.now()}-${originalName}`;

    const { error: upErr } = await sb.storage
      .from("moralclarity_uploads")
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
      });

    if (upErr) {
      return NextResponse.json(
        { error: "Upload failed", details: upErr },
        { status: 500, headers: cors() }
      );
    }

    /* === Extract text === */
    const extracted = await extractTextFromBuffer(buffer, originalName);
    if (!extracted || extracted.trim().length < 5) {
      return NextResponse.json(
        { error: "Could not extract text from file" },
        { status: 400, headers: cors() }
      );
    }

    /* === Build Solace prompt === */
    const system = buildCritiquePrompt(mode);
    const openaiPayload = {
      model: "gpt-4.1-mini",
      input: `${system}\n\n=== ARTICLE TEXT ===\n${extracted}`,
      temperature: 0.2,
      max_output_tokens: 1200,
    };

    let finalText = "";

    /* === Try Solace Backend First === */
    if (SOLACE_URL && SOLACE_KEY) {
      try {
        const r = await fetch(SOLACE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SOLACE_KEY}`,
          },
          body: JSON.stringify({
            system,
            messages: [{ role: "user", content: extracted }],
            stream: false,
          }),
        });

        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          finalText = String(j.text || j.output || "");
        }
      } catch {
        /* fall back */
      }
    }

    /* === Fallback to OpenAI if Solace not available === */
    if (!finalText) {
      const openai: OpenAI = await getOpenAI();
      const resp = await openai.responses.create(openaiPayload);
      finalText = resp.output_text || "[No response]";
    }

    /* === Validate rubric shape === */
    let rubric: any = null;
    try {
      rubric = rubricSchema.safeParse(finalText);
    } catch {
      rubric = null;
    }

    return NextResponse.json(
      {
        ok: true,
        critique: finalText,
        rubric: rubric?.success ? rubric.data : null,
        uploaded_path: path,
      },
      { status: 200, headers: cors() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500, headers: cors() }
    );
  }
}
