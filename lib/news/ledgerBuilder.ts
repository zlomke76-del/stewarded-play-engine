/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('[ledgerBuilder] Missing Supabase env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const WORKSPACE_ID = 'global_news';
const USER_KEY = 'system-news-anchor';

type BuildOpts = {
  limit?: number;
  since?: string; // ISO
};

export async function buildNewsNeutralityLedger(opts: BuildOpts = {}) {
  const startedAt = new Date().toISOString();
  const limit = opts.limit ?? 500;
  const since = opts.since; // optional backfill bound

  console.log('[ledgerBuilder] start', { startedAt, limit, since });

  // 1) Select truth_facts missing from the ledger
  const baseQuery = supabase
    .from('truth_facts')
    .select(
      `
      id,
      summary,
      raw_url,
      created_at,
      workspace_id,
      user_key
    `
    )
    .eq('scientific_domain', 'news')
    .eq('workspace_id', WORKSPACE_ID)
    .eq('user_key', USER_KEY)
    .not(
      'id',
      'in',
      supabase
        .from('news_neutrality_ledger')
        .select('truth_fact_id')
    )
    .order('created_at', { ascending: true })
    .limit(limit);

  const { data: facts, error: selErr } = since
    ? await baseQuery.gte('created_at', since)
    : await baseQuery;

  if (selErr) {
    console.error('[ledgerBuilder] select failed', selErr);
    throw selErr;
  }

  if (!facts || facts.length === 0) {
    throw new Error('[ledgerBuilder] ZERO_CANDIDATES — nothing to build');
  }

  console.log('[ledgerBuilder] candidates', facts.length);

  // 2) Build ledger rows (neutral placeholders; keep deterministic)
  const rows = facts.map((f) => ({
    truth_fact_id: f.id,
    workspace_id: WORKSPACE_ID,
    user_key: USER_KEY,
    story_title: (f.summary || '').slice(0, 160) || '(untitled)',
    story_url: f.raw_url,
    outlet: (() => {
      try {
        return new URL(f.raw_url).hostname.replace(/^www\./, '');
      } catch {
        return 'unknown';
      }
    })(),
    neutral_summary: f.summary || '',
    key_facts: '',

    // Bias/PI defaults (downstream scorers can update later)
    bias_language_score: 0,
    bias_source_score: 0,
    bias_framing_score: 0,
    bias_context_score: 0,
    bias_intent_score: 0,
    pi_score: 0.5,

    created_at: new Date().toISOString(),
  }));

  // 3) Insert ledger rows
  const { error: insErr, count } = await supabase
    .from('news_neutrality_ledger')
    .insert(rows, { count: 'exact' });

  if (insErr) {
    console.error('[ledgerBuilder] insert failed', insErr);
    throw insErr;
  }

  if (!count || count === 0) {
    throw new Error('[ledgerBuilder] ZERO_INSERTS — aborting');
  }

  const finishedAt = new Date().toISOString();
  console.log('[ledgerBuilder] done', { inserted: count, finishedAt });

  return { ok: true, inserted: count, startedAt, finishedAt };
}
