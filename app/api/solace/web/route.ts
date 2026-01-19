// app/api/solace/web/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { webSearch } from "@/lib/search";
import { getOpenAI } from "@/lib/openai";
import { buildInternetSystemPrompt } from "@/lib/solace/internet-mode";
import { getSolaceFeatureFlags } from "@/lib/solace/settings";

// Local defaults so we don't depend on lib/mcai/config
const SOLACE_WEB_MODEL =
  process.env.OPENAI_RESPONSE_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4.1";

type SearchResult = {
  title: string;
  url: string;
  content?: string;
  score?: number;
  published_date?: string;
};

type WebEvalBody = {
  question: string;
  url?: string;
  maxResults?: number;
};

function jsonError(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const flags = getSolaceFeatureFlags();
    if (!flags.internetEnabled) {
      return jsonError("Internet access for Solace is disabled.", 403, {
        code: "INTERNET_DISABLED",
      });
    }

    const body = (await req.json().catch(() => null)) as WebEvalBody | null;
    if (!body || !body.question?.trim()) {
      return jsonError("Missing 'question' in body.", 400, {
        code: "BAD_REQUEST",
      });
    }

    const { question } = body;
    const max = Math.max(1, Math.min(body.maxResults ?? 6, 10));

    // If a URL is provided, bias the query to that domain.
    let query = question.trim();
    if (body.url) {
      try {
        const u = new URL(body.url);
        const host = u.hostname.replace(/^www\./i, "");
        query = `site:${host} ${question}`;
      } catch {
        // keep original query if URL parsing fails
      }
    }

    const searchResults = (await webSearch(query, {
      max,
      news: false,
    })) as SearchResult[];

    const openai: any = await getOpenAI();

    const system = buildInternetSystemPrompt(
      `
You are helping the user evaluate or understand information retrieved from the web.

You are given:
- USER_QUESTION: what the user wants to know.
- SEARCH_RESULTS: JSON array of matched pages/snippets.

Rules:
- Base your reasoning ONLY on SEARCH_RESULTS.
- Be explicit when something is unknown or underspecified.
- Prefer synthesis ("here's the pattern") over link dumps.
- If results are thin or noisy, say so clearly.
      `.trim()
    );

    const prompt = `
SYSTEM_INSTRUCTIONS:
${system}

USER_QUESTION:
${question}

SEARCH_RESULTS (JSON):
${JSON.stringify(searchResults, null, 2)}
    `.trim();

    // Use simple string input to keep the SDK typing happy.
    // Higher max_output_tokens so Solace can deliver full, high-context analyses.
    const resp = await openai.responses.create({
      model: SOLACE_WEB_MODEL,
      input: prompt,
      max_output_tokens: 2800,
    });

    const answer = (resp as any).output_text as string | undefined;

    return NextResponse.json({
      ok: true,
      question,
      queryUsed: query,
      maxResults: max,
      resultsCount: searchResults.length,
      searchResults,
      answer: answer ?? "",
      model: SOLACE_WEB_MODEL,
    });
  } catch (err: any) {
    console.error("[solace/web] fatal error", err);
    return jsonError(
      err?.message || "Unexpected error in Solace web evaluation route.",
      500,
      { code: "SOLACE_WEB_FATAL" }
    );
  }
}

export async function GET(req: NextRequest) {
  // Convenience: allow GET with query params (?q=...&url=...&max=...)
  const url = new URL(req.url);
  const question =
    url.searchParams.get("q") || url.searchParams.get("question");
  const targetUrl = url.searchParams.get("url") || undefined;
  const maxParam = url.searchParams.get("max");
  const maxResults = maxParam ? Number(maxParam) || undefined : undefined;

  const body: WebEvalBody = {
    question: question || "Evaluate this website.",
    url: targetUrl,
    maxResults,
  };

  const fakeReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(body),
  });

  return POST(fakeReq);
}
