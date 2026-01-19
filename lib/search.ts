// lib/search.ts
export type TavilyOpts = {
  max?: number;
  news?: boolean;
  days?: number; // for news window
};

export type TavilyItem = {
  title: string;
  url: string;
  content?: string;
  score?: number;
  published_date?: string;
};

const TAVILY_URL = 'https://api.tavily.com/search';
const TVLY_KEY =
  process.env.TAVILY_API_KEY || process.env.NEXT_PUBLIC_TAVILY_API_KEY || '';

export async function webSearch(
  query: string,
  opts: TavilyOpts = {}
): Promise<TavilyItem[]> {
  try {
    if (!query?.trim()) {
      // No query, nothing to do
      return [];
    }

    if (!TVLY_KEY) {
      // This is the big one: logs when the key isn't present at runtime
      console.error('[webSearch] No Tavily API key configured');
      return [];
    }

    const body: any = {
      api_key: TVLY_KEY,
      query,
      // "advanced" gives deeper, multi-step search on Tavily's side
      search_depth: 'advanced',
      max_results: Math.max(1, Math.min(opts.max ?? 5, 10)),
      // Ask Tavily to return richer content when possible
      include_answer: true,
      include_raw_content: true,
    };

    if (opts.news) {
      body.search_type = 'news';
      if (opts.days) body.days = opts.days;
    }

    const r = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      // Surface HTTP errors (401 bad key, 429 rate limit, etc.)
      console.error('[webSearch] Tavily HTTP error', {
        status: r.status,
        statusText: r.statusText,
      });
      return [];
    }

    const j = await r.json().catch((err) => {
      console.error('[webSearch] Failed to parse Tavily JSON', err);
      return null;
    });

    if (!j) {
      console.error('[webSearch] Tavily response JSON was null/undefined');
      return [];
    }

    const items: any[] = j.results || j.news || [];

    if (!Array.isArray(items) || items.length === 0) {
      console.error('[webSearch] Tavily returned no items', {
        hasResults: !!j.results,
        hasNews: !!j.news,
      });
      return [];
    }

    return items.map((x) => ({
      title: x.title || x.url || 'result',
      url: x.url,
      content:
        x.content ||
        x.raw_content ||
        x.answer ||
        x.snippet ||
        '',
      score: x.score,
      published_date: x.published_date,
    }));
  } catch (err) {
    // Last-resort catch so Solace never blows up the whole route
    console.error('[webSearch] Unexpected error', err);
    return [];
  }
}
