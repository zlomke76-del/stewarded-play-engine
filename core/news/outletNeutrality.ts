// core/news/outletNeutrality.ts

export interface OutletNeutralityRow {
  outlet: string;
  outlet_normalized: string;
  total_stories: number;
  avg_bias_intent_score: number;
  avg_pi_score: number;
  min_bias_intent_score: number;
  max_bias_intent_score: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
}

export interface OutletNeutralityResponse {
  ok: boolean;
  meta?: {
    min_stories?: number;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
    limit?: number;
    total?: number;
    generated_at?: string;
  };
  outlets?: OutletNeutralityRow[];
}

/**
 * Load outlet neutrality aggregates from the MCAI public endpoint.
 *
 * @param baseUrl     e.g. https://studio.moralclarity.ai
 * @param limit       max number of outlets to return (default 200)
 * @param minStories  minimum story count filter (default 3)
 */
export async function loadOutletNeutrality(
  baseUrl: string,
  limit = 200,
  minStories = 3
): Promise<OutletNeutralityRow[] | null> {
  try {
    const qs = new URLSearchParams({
      limit: String(limit),
      min_stories: String(minStories),
    });

    const url = `${baseUrl.replace(/\/+$/, "")}/api/public/outlet-neutrality?${qs.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[outletNeutrality] failed to fetch outlets", {
        status: res.status,
        url,
      });
      return null;
    }

    const json = (await res.json()) as OutletNeutralityResponse;
    return Array.isArray(json.outlets) ? json.outlets : [];
  } catch (err) {
    console.error("[outletNeutrality] fatal error loading outlets", err);
    return null;
  }
}
