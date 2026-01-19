// core/news/digestLoader.ts

export interface NewsDigestStory {
  ledger_id: string;
  truth_fact_id: string | null;
  story_id: string | null;
  story_title: string | null;
  story_url: string | null;
  outlet: string | null;
  category: string | null;
  neutral_summary: string | null;
  key_facts: string | null;
  context_background: string | null;
  stakeholder_positions: string | null;
  timeline: string | null;
  disputed_claims: string | null;
  omissions_detected: string | null;
  bias_language_score: number | null;
  bias_source_score: number | null;
  bias_framing_score: number | null;
  bias_context_score: number | null;
  bias_intent_score: number | null;
  pi_score: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NewsDigestResponse {
  ok: boolean;
  workspaceId?: string;
  userKey?: string;
  route_started_at?: string;
  route_finished_at?: string;
  count?: number;
  stories?: NewsDigestStory[];
}

/**
 * Load the public neutral news digest from the MCAI API.
 *
 * @param baseUrl e.g. https://studio.moralclarity.ai
 * @param limit   number of stories (default 20)
 */
export async function loadNeutralNewsDigest(
  baseUrl: string,
  limit = 20
): Promise<{ raw: string; json: NewsDigestResponse } | null> {
  try {
    const url = `${baseUrl.replace(/\/+$/, "")}/api/public/news-digest?limit=${encodeURIComponent(
      String(limit)
    )}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[digestLoader] failed to fetch digest", {
        status: res.status,
        url,
      });
      return null;
    }

    const json = (await res.json()) as NewsDigestResponse;
    const raw = JSON.stringify(json, null, 2);

    return { raw, json };
  } catch (err) {
    console.error("[digestLoader] fatal error loading digest", err);
    return null;
  }
}
