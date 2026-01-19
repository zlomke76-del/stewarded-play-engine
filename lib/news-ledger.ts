// lib/news-ledger.ts
/* News → Truth Ledger + Neutrality Ledger writer
 *
 * This module is intentionally defensive:
 * - If SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing, all functions no-op.
 * - Errors are logged to console but never thrown to callers.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

let adminClient: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// Shapes we expect from the existing helpers
export type CachedNewsStory = {
  id?: string | null;
  title?: string | null;
  source?: string | null;
  url?: string | null;
  summary?: string | null;
};

export type WebNewsResult = {
  title?: string | null;
  url?: string | null;
  content?: string | null;
  published_date?: string | null;
  score?: number | null;
};

function extractHostname(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeOutletName(source?: string | null, url?: string | null): string {
  const s = (source || '').trim();
  if (s) return s;
  const host = extractHostname(url);
  return host || 'unknown';
}

type LogBatchArgs = {
  workspaceId?: string | null;
  userKey: string;
  userId?: string | null;
  query: string;
  dateIso?: string; // YYYY-MM-DD, optional
  cacheStories?: CachedNewsStory[]; // from getNewsForDate
  webStories?: WebNewsResult[]; // from webSearch (news mode)
};

/**
 * Insert a batch of news stories into:
 *  - truth_facts (one row per story)
 *  - news_neutrality_ledger (linked via truth_fact_id when available)
 *
 * This is designed for small batches (<= 5 per interaction).
 */
export async function logNewsBatchToLedgers(args: LogBatchArgs): Promise<void> {
  if (!adminClient) return;
  const {
    workspaceId = null,
    userKey,
    userId = null,
    query,
    dateIso,
    cacheStories = [],
    webStories = [],
  } = args;

  const client = adminClient;
  const now = new Date();
  const createdAt = now.toISOString();
  const dayIso = dateIso || createdAt.slice(0, 10);

  const allStories: Array<{
    story_id: string | null;
    title: string | null;
    url: string | null;
    outlet: string;
    snapshot: string | null;
    category: string;
    sourcesPayload: any;
  }> = [];

  // Cached daily stories (already normalized elsewhere)
  for (const s of cacheStories) {
    if (!s) continue;
    const title = (s.title || '').trim() || null;
    const url = s.url || null;
    const outlet = normalizeOutletName(s.source, url);
    const snapshot = (s.summary || '').trim() || null;

    allStories.push({
      story_id: (s.id as string | null) ?? url,
      title,
      url,
      outlet,
      snapshot,
      category: 'news_story_cached',
      sourcesPayload: [
        {
          title,
          url,
          outlet,
          kind: 'cache',
          source: s.source || null,
        },
      ],
    });
  }

  // Web-search "news" results
  for (const s of webStories) {
    if (!s) continue;
    const title = (s.title || '').trim() || null;
    const url = s.url || null;
    const outlet = normalizeOutletName(null, url);
    const snapshot = (s.content || '').trim() || null;

    allStories.push({
      story_id: url,
      title,
      url,
      outlet,
      snapshot,
      category: 'news_story_web',
      sourcesPayload: [
        {
          title,
          url,
          outlet,
          kind: 'web',
          published_date: s.published_date || null,
          score: s.score ?? null,
        },
      ],
    });
  }

  if (!allStories.length) return;

  for (const story of allStories) {
    try {
      const {
        story_id,
        title,
        url,
        outlet,
        snapshot,
        category,
        sourcesPayload,
      } = story;

      const summaryForTruth =
        snapshot ||
        (title ? `News story: ${title}` : 'News story without snapshot text available.');

      // 1) Insert into truth_facts
      let truthId: string | null = null;
      try {
        const { data, error } = await client
          .from('truth_facts')
          .insert({
            workspace_id: workspaceId,
            user_key: userKey,
            user_id: userId,
            query,
            summary: summaryForTruth,
            pi_score: 0.5,
            confidence_level: 'medium',
            scientific_domain: 'news',
            category,
            status: 'hypothesis',
            sources: sourcesPayload,
            raw_url: url,
            raw_snapshot: snapshot,
            // Optional metadata columns may exist; if they don't, Postgres ignores extras
            story_id,
            story_title: title,
            outlet,
            day_iso: dayIso,
          } as any)
          .select('id')
          .single();

        if (error) {
          console.error('[news-ledger] truth_facts insert error', error);
        } else if (data?.id) {
          truthId = data.id as string;
        }
      } catch (err) {
        console.error('[news-ledger] truth_facts insert threw', err);
      }

      // 2) Insert into news_neutrality_ledger
      try {
        const neutralSummary =
          snapshot ||
          (title
            ? `Neutral baseline summary placeholder for "${title}".`
            : 'Neutral baseline summary placeholder.');

        const row: Record<string, any> = {
          workspace_id: workspaceId,
          user_key: userKey,
          user_id: userId,
          truth_fact_id: truthId,
          outlet,
          story_id,
          story_title: title,
          story_url: url,
          neutral_summary: neutralSummary,
          raw_story: snapshot,
          category,
          pi_score: 0.5,
          bias_intent_score: 0.5,
          bias_language_score: 0.5,
          bias_source_score: 0.5,
          bias_context_score: 0.5,
          bias_framing_score: 0.5,
          created_at: createdAt,
        };

        const { error } = await client.from('news_neutrality_ledger').insert(row);
        if (error) {
          console.error('[news-ledger] news_neutrality_ledger insert error', error);
        }
      } catch (err) {
        console.error('[news-ledger] news_neutrality_ledger insert threw', err);
      }
    } catch (outerErr) {
      console.error('[news-ledger] unexpected batch error', outerErr);
    }
  }
}
