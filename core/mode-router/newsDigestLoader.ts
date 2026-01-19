/* Moral Clarity AI • Neutral News Digest Loader v1
 *
 * Purpose:
 *   Fetch digest + outlet aggregates for Solace News Anchor mode,
 *   package them into the [NEUTRAL_NEWS_DIGEST] system block,
 *   and return ready-to-insert OpenAI ChatCompletionMessageParams.
 *
 * Notes:
 *   - This helper never throws. If an error occurs, it sends
 *     an empty digest block (Solace will correctly report
 *     “no stories available” instead of drifting).
 *
 *   - Uses the public, read-only endpoints you already built:
 *       /api/public/news-digest?limit=N
 *       /api/public/outlet-neutrality
 */

import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Defaults for your daily digest size (adjust anytime)
const DEFAULT_LIMIT = 20;

/* ========= LOW-LEVEL FETCH HELPERS ========= */

async function safeJsonFetch(url: string, label: string): Promise<any | null> {
  try {
    const r = await fetch(url, { method: "GET", cache: "no-store" });
    if (!r.ok) {
      console.warn(`[newsDigestLoader] ${label} fetch failed`, {
        status: r.status,
        url,
      });
      return null;
    }
    return await r.json();
  } catch (err) {
    console.error(`[newsDigestLoader] ${label} fatal error`, err);
    return null;
  }
}

/* ========= MAIN LOADER ========= */

/**
 * Fetch digest + outlet aggregates and package as a system message block.
 */
export async function loadNeutralNewsDigest(
  baseUrl: string,  // origin for your API, e.g. https://studio.moralclarity.ai
  limit = DEFAULT_LIMIT,
): Promise<ChatCompletionMessageParam[]> {
  const digestUrl = `${baseUrl}/api/public/news-digest?limit=${limit}`;
  const outletUrl = `${baseUrl}/api/public/outlet-neutrality`;

  const digest = await safeJsonFetch(digestUrl, "digest");
  const outlets = await safeJsonFetch(outletUrl, "outlets");

  const digestStories = Array.isArray(digest?.stories) ? digest.stories : [];
  const outletRows = Array.isArray(outlets?.outlets) ? outlets.outlets : [];

  const payload = {
    ok: true,
    digest_count: digestStories.length,
    outlet_count: outletRows.length,
    generated_at: new Date().toISOString(),
    digest: digestStories,
    outletAggregates: outletRows,
  };

  const blockText =
    "[NEUTRAL_NEWS_DIGEST]\n" +
    JSON.stringify(payload, null, 2) +
    "\n[/NEUTRAL_NEWS_DIGEST]";

  const systemMsg: ChatCompletionMessageParam = {
    role: "system",
    content: blockText,
  };

  return [systemMsg];
}
