// lib/news/outlets.ts

export type OutletConfig = {
  canonical: string;     // canonical root domain
  rss?: string;          // optional RSS/Atom feed
  tavilyQuery?: string;  // optional Tavily query override
  maxResults?: number;   // cap per outlet for backfill
};

/**
 * Authoritative outlet registry
 * Aligned to Moral Clarity Newsroom cabinet
 * Coverage spans: wire, national, international, finance, policy, science
 */
export const OUTLET_CONFIGS: OutletConfig[] = [
  // ─────────────────────────────────────────
  // Wire / Baseline Neutral
  // ─────────────────────────────────────────
  {
    canonical: "reuters.com",
    rss: "https://www.reutersagency.com/feed/?best-topics=politics",
    tavilyQuery: "site:reuters.com",
    maxResults: 150,
  },
  {
    canonical: "apnews.com",
    rss: "https://apnews.com/apf-topnews",
    tavilyQuery: "site:apnews.com",
    maxResults: 150,
  },
  {
    canonical: "npr.org",
    rss: "https://feeds.npr.org/1001/rss.xml",
    tavilyQuery: "site:npr.org",
    maxResults: 150,
  },
  {
    canonical: "pbs.org",
    rss: "https://www.pbs.org/newshour/feeds/rss/headlines.xml",
    tavilyQuery: "site:pbs.org",
    maxResults: 120,
  },

  // ─────────────────────────────────────────
  // US National
  // ─────────────────────────────────────────
  {
    canonical: "nytimes.com",
    rss: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    tavilyQuery: "site:nytimes.com",
    maxResults: 150,
  },
  {
    canonical: "washingtonpost.com",
    rss: "https://feeds.washingtonpost.com/rss/world",
    tavilyQuery: "site:washingtonpost.com",
    maxResults: 150,
  },
  {
    canonical: "cnn.com",
    rss: "https://rss.cnn.com/rss/cnn_topstories.rss",
    tavilyQuery: "site:cnn.com",
    maxResults: 120,
  },
  {
    canonical: "foxnews.com",
    rss: "https://moxie.foxnews.com/google-publisher/latest.xml",
    tavilyQuery: "site:foxnews.com",
    maxResults: 120,
  },
  {
    canonical: "msnbc.com",
    rss: "https://www.msnbc.com/feeds/latest",
    tavilyQuery: "site:msnbc.com",
    maxResults: 100,
  },
  {
    canonical: "newsmax.com",
    tavilyQuery: "site:newsmax.com",
    maxResults: 80,
  },

  // ─────────────────────────────────────────
  // UK / Europe
  // ─────────────────────────────────────────
  {
    canonical: "bbc.com",
    rss: "https://feeds.bbci.co.uk/news/rss.xml",
    tavilyQuery: "site:bbc.com",
    maxResults: 150,
  },
  {
    canonical: "thetimes.co.uk",
    tavilyQuery: "site:thetimes.co.uk",
    maxResults: 80,
  },
  {
    canonical: "theguardian.com",
    rss: "https://www.theguardian.com/world/rss",
    tavilyQuery: "site:theguardian.com",
    maxResults: 120,
  },
  {
    canonical: "telegraph.co.uk",
    tavilyQuery: "site:telegraph.co.uk",
    maxResults: 80,
  },
  {
    canonical: "dw.com",
    rss: "https://rss.dw.com/xml/rss-en-all",
    tavilyQuery: "site:dw.com",
    maxResults: 100,
  },
  {
    canonical: "france24.com",
    rss: "https://www.france24.com/en/rss",
    tavilyQuery: "site:france24.com",
    maxResults: 100,
  },

  // ─────────────────────────────────────────
  // Middle East / Global South
  // ─────────────────────────────────────────
  {
    canonical: "aljazeera.com",
    rss: "https://www.aljazeera.com/xml/rss/all.xml",
    tavilyQuery: "site:aljazeera.com",
    maxResults: 120,
  },
  {
    canonical: "rferl.org",
    tavilyQuery: "site:rferl.org",
    maxResults: 80,
  },

  // ─────────────────────────────────────────
  // Finance / Markets
  // ─────────────────────────────────────────
  {
    canonical: "wsj.com",
    rss: "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    tavilyQuery: "site:wsj.com",
    maxResults: 120,
  },
  {
    canonical: "bloomberg.com",
    rss: "https://www.bloomberg.com/feed/podcast/etf-report.xml",
    tavilyQuery: "site:bloomberg.com",
    maxResults: 120,
  },
  {
    canonical: "ft.com",
    rss: "https://www.ft.com/?format=rss",
    tavilyQuery: "site:ft.com",
    maxResults: 100,
  },
  {
    canonical: "forbes.com",
    rss: "https://www.forbes.com/innovation/feed/",
    tavilyQuery: "site:forbes.com",
    maxResults: 80,
  },
  {
    canonical: "cnbc.com",
    rss: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    tavilyQuery: "site:cnbc.com",
    maxResults: 100,
  },

  // ─────────────────────────────────────────
  // Policy / Analysis
  // ─────────────────────────────────────────
  {
    canonical: "axios.com",
    rss: "https://www.axios.com/rss",
    tavilyQuery: "site:axios.com",
    maxResults: 80,
  },
  {
    canonical: "theatlantic.com",
    rss: "https://www.theatlantic.com/feed/all/",
    tavilyQuery: "site:theatlantic.com",
    maxResults: 80,
  },
  {
    canonical: "politico.com",
    rss: "https://www.politico.com/rss/politics08.xml",
    tavilyQuery: "site:politico.com",
    maxResults: 80,
  },

  // ─────────────────────────────────────────
  // Science / Technology (slow signal)
  // ─────────────────────────────────────────
  {
    canonical: "nature.com",
    rss: "https://www.nature.com/subjects/news-and-views.rss",
    tavilyQuery: "site:nature.com",
    maxResults: 60,
  },
  {
    canonical: "science.org",
    rss: "https://www.science.org/rss/news_current.xml",
    tavilyQuery: "site:science.org",
    maxResults: 60,
  },
  {
    canonical: "technologyreview.com",
    rss: "https://www.technologyreview.com/feed/",
    tavilyQuery: "site:technologyreview.com",
    maxResults: 60,
  },
];

/**
 * Lookup helper
 */
export function getOutletConfig(
  canonical: string
): OutletConfig | undefined {
  return OUTLET_CONFIGS.find((c) => c.canonical === canonical);
}
