/* app/api/news/solace-digest/route.ts */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ========= ENV / SUPABASE INIT ========= */

const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
const SUPABASE_SERVICE_ROLE_KEY = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[news/solace-digest] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – route will return 500 at runtime.'
  );
}

function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      '[news/solace-digest] Supabase admin credentials not configured'
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/* ========= TYPES (LOOSE) ========= */

type SolaceDigestRow = {
  bucket: number;
  id: string;
  workspace_id: string | null;
  user_key: string | null;
  user_id: string | null;
  truth_fact_id: string | null;
  story_id: string | null;
  story_title: string | null;
  story_url: string | null;
  outlet: string | null;
  category: string | null;
  raw_story: string | null;
  neutral_summary: string | null;
  key_facts: string[] | null;
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
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  outlet_group: string | null;
};

type SolaceDigestStory = {
  id: string;
  truth_fact_id: string | null;
  story_id: string | null;
  title: string;
  url: string | null;
  outlet: string | null;
  outlet_group: string | null;
  category: string | null;

  neutral_summary: string;
  key_facts: string[];
  context_background: string;
  stakeholder_positions: string;
  timeline: string;
  disputed_claims: string;
  omissions_detected: string;

  bias_language_score: number | null;
  bias_source_score: number | null;
  bias_framing_score: number | null;
  bias_context_score: number | null;
  bias_intent_score: number | null;
  pi_score: number | null;

  notes: string | null;
  created_at: string | null;
};

/* ========= HELPERS ========= */

function jsonError(
  message: string,
  status = 500,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json(
    { ok: false, error: message, ...extra },
    { status }
  );
}

function coerceArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? '')).filter((v) => v.length > 0);
  }
  // If Supabase happens to return a stringified array
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v ?? '')).filter((v) => v.length > 0);
    }
  } catch {
    // fall through
  }
  return [String(value)];
}

function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function mapRowToStory(row: SolaceDigestRow): SolaceDigestStory {
  return {
    id: row.id,
    truth_fact_id: row.truth_fact_id,
    story_id: row.story_id,
    title: (row.story_title || '').trim() || '(untitled story)',
    url: row.story_url,
    outlet: row.outlet,
    outlet_group: row.outlet_group,
    category: row.category,

    neutral_summary: (row.neutral_summary || '').trim(),
    key_facts: coerceArray(row.key_facts),
    context_background: (row.context_background || '').trim(),
    stakeholder_positions: (row.stakeholder_positions || '').trim(),
    timeline: (row.timeline || '').trim(),
    disputed_claims: (row.disputed_claims || '').trim(),
    omissions_detected: (row.omissions_detected || '').trim(),

    bias_language_score: coerceNumber(row.bias_language_score),
    bias_source_score: coerceNumber(row.bias_source_score),
    bias_framing_score: coerceNumber(row.bias_framing_score),
    bias_context_score: coerceNumber(row.bias_context_score),
    bias_intent_score: coerceNumber(row.bias_intent_score),
    pi_score: coerceNumber(row.pi_score),

    notes: row.notes,
    created_at: row.created_at,
  };
}

/* ========= CORE LOGIC ========= */

async function getSolaceNewsDigest(): Promise<{
  stories: SolaceDigestStory[];
  buckets: {
    wire: SolaceDigestStory[];
    left: SolaceDigestStory[];
    right: SolaceDigestStory[];
    global: SolaceDigestStory[];
    other: SolaceDigestStory[];
  };
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('vw_solace_news_digest')
    .select('*')
    .order('bucket', { ascending: true })
    .order('bias_intent_score', { ascending: true })
    .order('pi_score', { ascending: false });

  if (error) {
    console.error('[news/solace-digest] Supabase view error', error);
    throw new Error(
      `Failed to load vw_solace_news_digest: ${error.message || 'unknown error'}`
    );
  }

  const rows = (data || []) as SolaceDigestRow[];

  const stories = rows.map(mapRowToStory);

  const buckets = {
    wire: [] as SolaceDigestStory[],
    left: [] as SolaceDigestStory[],
    right: [] as SolaceDigestStory[],
    global: [] as SolaceDigestStory[],
    other: [] as SolaceDigestStory[],
  };

  for (const story of stories) {
    const group = (story.outlet_group || 'other').toLowerCase();
    switch (group) {
      case 'wire':
        buckets.wire.push(story);
        break;
      case 'left':
        buckets.left.push(story);
        break;
      case 'right':
        buckets.right.push(story);
        break;
      case 'global':
        buckets.global.push(story);
        break;
      default:
        buckets.other.push(story);
        break;
    }
  }

  return { stories, buckets };
}

/* ========= HANDLER ========= */

/**
 * GET /api/news/solace-digest
 *
 * This route is the **only** thing Solace should call for:
 *   "What's the news?"
 *
 * It:
 * - Reads from vw_solace_news_digest (8 balanced stories max)
 * - Returns structured Neutral Briefs + bias scores + outlet info
 * - Does NOT call OpenAI, Tavily, or Browserless
 */
export async function GET(_req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError(
        'Supabase admin client not configured on server (missing env).',
        500,
        { code: 'NO_SUPABASE_ADMIN' }
      );
    }

    const startedAt = new Date().toISOString();
    const { stories, buckets } = await getSolaceNewsDigest();
    const finishedAt = new Date().toISOString();

    const today = new Date().toISOString().slice(0, 10);

    return NextResponse.json({
      ok: true,
      date: today,
      startedAt,
      finishedAt,
      total_stories: stories.length,
      buckets_summary: {
        wire: buckets.wire.length,
        left: buckets.left.length,
        right: buckets.right.length,
        global: buckets.global.length,
        other: buckets.other.length,
      },
      stories,
      buckets,
    });
  } catch (err: any) {
    console.error('[news/solace-digest] fatal error', err);
    return jsonError(
      err?.message || 'Unexpected error in solace news digest.',
      500,
      { code: 'NEWS_SOLACE_DIGEST_FATAL' }
    );
  }
}

/**
 * Optional: allow POST to trigger the same behavior
 * (e.g., internal MCAI call via POST).
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
