/* ========= lib/news/extract.ts (STRICT MODE) ========= */

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN || "";

/* ========= TYPES ========= */

export type ExtractedArticle = {
  success: boolean;
  url: string;
  outlet: string;
  title: string;
  authors: string[];
  published_at: string | null;
  full_text: string;
  clean_text: string;
  raw_html?: string;
  source: "browserless" | "tavily" | "fetch" | "none";
  error?: string;
};

/* ========= CONSTANTS ========= */

const MIN_ARTICLE_CHARS = 400; // strict-mode threshold (Option C)

/* ========= DOMAIN NORMALIZATION ========= */

const CANONICAL_DOMAIN_MAP: Record<string, string> = {
  // Groups of variants unified to base domains
  "www.nbcnews.com": "nbcnews.com",
  "nbcnews.com": "nbcnews.com",
  "nbc.com": "nbcnews.com",

  "www.nytimes.com": "nytimes.com",
  "nytimes.com": "nytimes.com",

  "www.motherjones.com": "motherjones.com",
  "motherjones.com": "motherjones.com",

  "www.foxnews.com": "foxnews.com",
  "foxnews.com": "foxnews.com",

  "www.apnews.com": "apnews.com",
  "apnews.com": "apnews.com",

  "www.bloomberg.com": "bloomberg.com",
  "bloomberg.com": "bloomberg.com",

  // Add more as needed…
};

function normalizeDomain(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const noWww = host.replace(/^www\./, "");
    return CANONICAL_DOMAIN_MAP[host] || CANONICAL_DOMAIN_MAP[noWww] || noWww;
  } catch {
    return "unknown";
  }
}

/* ========= HTML UTILITIES ========= */

function stripHtml(html: string): string {
  if (!html) return "";
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<\/?[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  return text.replace(/\s+/g, " ").trim();
}

function clamp(text: string, max = 20000): string {
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max) + "\n[...truncated...]";
}

/* ========= ARTICLE DETECTION ========= */

function looksLikeArticle(text: string): boolean {
  if (!text) return false;
  if (text.length < MIN_ARTICLE_CHARS) return false; // strict threshold
  if (text.split(" ").length < 80) return false; // sanity: avoid short blurbs
  return true;
}

/* ========= JSON-LD EXTRACTION ========= */

function extractJsonLd(html: string) {
  try {
    const match = html.match(
      /<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i
    );
    if (!match) return null;

    const data = JSON.parse(match[1].trim());
    if (!data) return null;

    if (Array.isArray(data)) {
      return data.find((obj) => obj["@type"]?.includes("Article")) || null;
    }

    return data["@type"]?.includes("Article") ? data : null;
  } catch {
    return null;
  }
}

/* ========= MAIN EXTRACTOR ========= */

export async function extractArticle(opts: {
  url: string;
  tavilyContent?: string;
  tavilyTitle?: string;
}): Promise<ExtractedArticle> {
  const { url, tavilyContent, tavilyTitle } = opts;
  const outlet = normalizeDomain(url);

  if (!url) {
    const text = (tavilyContent || "").trim();
    return {
      success: looksLikeArticle(text),
      url,
      outlet,
      title: tavilyTitle || "",
      authors: [],
      published_at: null,
      full_text: clamp(text),
      clean_text: text,
      source: text ? "tavily" : "none",
      error: text ? undefined : "No URL and no content provided",
    };
  }

  /* ========= 1) Browserless Attempt ========= */

  if (BROWSERLESS_TOKEN) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(
        `https://chrome.browserless.io/content?token=${encodeURIComponent(
          BROWSERLESS_TOKEN
        )}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            options: {
              addHeaders: { "User-Agent": "MoralClarity-NewsBot/1.0" },
            },
          }),
        }
      );

      clearTimeout(timeout);

      if (resp.ok) {
        let raw = await resp.text();
        try {
          const tryJson = JSON.parse(raw);
          if (typeof tryJson?.data === "string") raw = tryJson.data;
        } catch {}

        const clean = stripHtml(raw);
        const jsonLd = extractJsonLd(raw);

        if (looksLikeArticle(clean)) {
          return {
            success: true,
            url,
            outlet,
            title: jsonLd?.headline || tavilyTitle || "",
            authors: jsonLd?.author?.name
              ? [jsonLd.author.name]
              : Array.isArray(jsonLd?.author)
              ? jsonLd.author.map((a: any) => a.name).filter(Boolean)
              : [],
            published_at: jsonLd?.datePublished || null,
            full_text: clamp(clean),
            clean_text: clean,
            raw_html: clamp(raw, 30000),
            source: "browserless",
          };
        }
      }
    } catch (err) {
      console.error("[extract] Browserless failure", { url, err });
    }
  }

  /* ========= 2) Tavily Fallback ========= */

  if (tavilyContent && tavilyContent.trim()) {
    const clean = tavilyContent.trim();
    if (looksLikeArticle(clean)) {
      return {
        success: true,
        url,
        outlet,
        title: tavilyTitle || "",
        authors: [],
        published_at: null,
        full_text: clamp(clean),
        clean_text: clean,
        source: "tavily",
      };
    }
  }

  /* ========= 3) Direct Fetch Fallback ========= */

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "MoralClarity-NewsBot/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (resp.ok) {
      const html = await resp.text();
      const clean = stripHtml(html);
      const jsonLd = extractJsonLd(html);

      if (looksLikeArticle(clean)) {
        return {
          success: true,
          url,
          outlet,
          title: jsonLd?.headline || tavilyTitle || "",
          authors: jsonLd?.author?.name
            ? [jsonLd.author.name]
            : Array.isArray(jsonLd?.author)
            ? jsonLd.author.map((a: any) => a.name).filter(Boolean)
            : [],
          published_at: jsonLd?.datePublished || null,
          full_text: clamp(clean),
          clean_text: clean,
          raw_html: clamp(html, 30000),
          source: "fetch",
        };
      }
    }
  } catch (err) {
    console.error("[extract] fetch fallback failed", { url, err });
  }

  /* ========= 4) Hard Fail ========= */

  return {
    success: false,
    url,
    outlet,
    title: tavilyTitle || "",
    authors: [],
    published_at: null,
    full_text: "",
    clean_text: "",
    source: "none",
    error: "Strict mode: No valid article text found",
  };
}


