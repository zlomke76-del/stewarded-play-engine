// lib/news/rss.ts

/**
 * Very small RSS/Atom helper so we don't need heavy XML dependencies.
 * This is "good enough" to pull <item><link>...</link> URLs and dates.
 */

export type RssItem = {
  link: string;
  pubDate?: string;
};

/**
 * Fetches an RSS/Atom feed and extracts basic items.
 * We intentionally keep this parser minimal: it looks for
 * <item>, <link>, and <pubDate> tags.
 */
export async function fetchRssItems(feedUrl: string): Promise<RssItem[]> {
  const res = await fetch(feedUrl);
  if (!res.ok) {
    console.warn("[rss] failed to load feed", feedUrl, res.status);
    return [];
  }

  const xml = await res.text();

  const items: RssItem[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml))) {
    const itemXml = match[1];

    const linkMatch =
      itemXml.match(/<link[^>]*>([^<]+)<\/link>/i) ||
      itemXml.match(/<link[^>]*href="([^"]+)"/i);
    if (!linkMatch) continue;

    const link = linkMatch[1].trim();

    const pubDateMatch = itemXml.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : undefined;

    items.push({ link, pubDate });
  }

  return items;
}

/**
 * Filters items to those with pubDate within the last N days.
 * If pubDate is missing or invalid, we keep it by default — you can
 * change this later if you want stricter filtering.
 */
export function filterItemsByDays(items: RssItem[], days: number): RssItem[] {
  if (!days || days <= 0) return items;

  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    if (!item.pubDate) return true;
    const t = Date.parse(item.pubDate);
    if (Number.isNaN(t)) return true;
    return t >= cutoff;
  });
}
