// lib/news-cache.ts

import { createClient, type PostgrestError } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
const SUPABASE_SERVICE_ROLE_KEY = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[news-cache] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – news cache will always return [].'
  );
}

function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[news-cache] Supabase admin credentials not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Shape returned to callers (e.g. /app/api/chat/route.ts)
 */
export type CachedNewsStory = {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  outlet: string | null;
  /** Human-readable summary derived from story_text */
  summary: string;
  story_date: string | null; // YYYY-MM-DD
  published_at: string | null;
  fetched_at: string | null;
};

type NewsCacheRow = {
  id: string;
  source: string | null;
  outlet: string | null;
  story_title: string | null;
  story_url: string | null;
  story_text: string | null;
  story_date: string | null;
  published_at: string | null;
  fetched_at: string | null;
  title: string | null;
  url: string | null;
};

/**
 * Build compact story summary
 */
function buildSummary(text: string | null | undefined): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= 600) return trimmed;
  return trimmed.slice(0, 600).trimEnd() + '…';
}

/**
 * Load cached news stories for a specific date (YYYY-MM-DD).
 */
export async function getNewsForDate(
  isoDate: string,
  limit = 5
): Promise<CachedNewsStory[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('news_cache')
      .select(
        'id, source, outlet, story_title, story_url, story_text, story_date, published_at, fetched_at, title, url'
      )
      .eq('story_date', isoDate)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      const e = error as PostgrestError;
      console.error('[news-cache] Supabase error', {
        code: e.code,
        message: e.message,
        details: e.details,
        hint: e.hint,
      });
      return [];
    }

    const rows = (data || []) as NewsCacheRow[];

    return rows.map((row) => {
      const title =
        (row.title || row.story_title || '').trim() || '(untitled story)';
      const url = row.url || row.story_url || null;

      return {
        id: row.id,
        title,
        url,
        source: row.source,
        outlet: row.outlet,
        summary: buildSummary(row.story_text),
        story_date: row.story_date,
        published_at: row.published_at,
        fetched_at: row.fetched_at,
      };
    });
  } catch (err) {
    console.error('[news-cache] fatal error', err);
    return [];
  }
}

/**
 * getNewsDigest()
 * Canonical daily digest for the chat engine.
 * Finds the most recent story_date and returns top stories.
 */
export async function getNewsDigest(limit = 8) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return {
      date: null,
      stories: [],
      domainStats: {},
      errors: ['Supabase credentials missing'],
    };
  }

  try {
    const supabase = createAdminClient();

    // Fetch latest date with stories
    const { data: dates, error: dateErr } = await supabase
      .from('news_cache')
      .select('story_date')
      .order('story_date', { ascending: false })
      .limit(1);

    if (dateErr || !dates?.length) {
      return {
        date: null,
        stories: [],
        domainStats: {},
        errors: ['No news available'],
      };
    }

    const latestDate = dates[0].story_date;

    // Fetch stories for this date
    const stories = await getNewsForDate(latestDate, limit);

    return {
      date: latestDate,
      stories,
      domainStats: {}, // optional placeholder for your outlet scoring system
      errors: [],
    };
  } catch (err) {
    console.error('[news-cache] getNewsDigest fatal error', err);
    return {
      date: null,
      stories: [],
      domainStats: {},
      errors: [String(err)],
    };
  }
}

