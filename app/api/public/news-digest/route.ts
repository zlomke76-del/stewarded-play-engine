/* app/api/public/news-digest/route.ts */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ========= ENV / SUPABASE INIT ========= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[public/news-digest] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – route will return 500 at runtime.'
  );
}

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

/* ========= HELPERS ========= */

function jsonError(
  message: string,
  status = 500,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/* ========= CONSTANTS ========= */

const SYSTEM_WORKSPACE_ID = process.env.MCA_WORKSPACE_ID || 'global_news';
const SYSTEM_USER_KEY = 'system-news-anchor';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/* ========= HANDLER ========= */

/**
 * GET /api/public/news-digest
 *
 * Query params:
 *   - limit?: number (default 20, max 100)
 *
 * Returns a list of the most recently scored stories for the
 * global system anchor, suitable for:
 *   - Solace “What’s the news today?” answers
 *   - Public marketing page daily digest
 */
export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return jsonError(
        'Supabase admin client not configured on server (missing env).',
        500,
        { code: 'NO_SUPABASE_ADMIN' }
      );
    }

    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');

    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = Math.min(MAX_LIMIT, Math.max(1, parsed));
      }
    }

    const startedAt = new Date().toISOString();

    // Pull the latest system-anchor ledger entries
    const { data, error } = await supabaseAdmin
      .from('news_neutrality_ledger')
      .select(
        `
        id,
        truth_fact_id,
        story_id,
        story_title,
        story_url,
        outlet,
        category,
        neutral_summary,
        key_facts,
        context_background,
        stakeholder_positions,
        timeline,
        disputed_claims,
        omissions_detected,
        bias_language_score,
        bias_source_score,
        bias_framing_score,
        bias_context_score,
        bias_intent_score,
        pi_score,
        created_at,
        updated_at
      `
      )
      .eq('workspace_id', SYSTEM_WORKSPACE_ID)
      .eq('user_key', SYSTEM_USER_KEY)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[public/news-digest] ledger query error', error);
      return jsonError(
        'Failed to load news digest from ledger.',
        500,
        {
          code: 'LEDGER_QUERY_FAILED',
          supabase_code: (error as any).code,
          supabase_message: (error as any).message,
        }
      );
    }

    const finishedAt = new Date().toISOString();

    // Shape it in a way that is stable for Solace + marketing UI
    const stories = (data || []).map((row) => ({
      ledger_id: row.id,
      truth_fact_id: row.truth_fact_id,
      story_id: row.story_id,
      story_title: row.story_title,
      story_url: row.story_url,
      outlet: row.outlet,
      category: row.category,

      neutral_summary: row.neutral_summary,
      key_facts: row.key_facts,

      context_background: row.context_background,
      stakeholder_positions: row.stakeholder_positions,
      timeline: row.timeline,
      disputed_claims: row.disputed_claims,
      omissions_detected: row.omissions_detected,

      bias_language_score: row.bias_language_score,
      bias_source_score: row.bias_source_score,
      bias_framing_score: row.bias_framing_score,
      bias_context_score: row.bias_context_score,
      bias_intent_score: row.bias_intent_score,
      pi_score: row.pi_score,

      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({
      ok: true,
      workspaceId: SYSTEM_WORKSPACE_ID,
      userKey: SYSTEM_USER_KEY,
      route_started_at: startedAt,
      route_finished_at: finishedAt,
      count: stories.length,
      stories,
    });
  } catch (err: any) {
    console.error('[public/news-digest] fatal error', err);
    return jsonError(
      err?.message || 'Unexpected error in public news digest.',
      500,
      { code: 'PUBLIC_NEWS_DIGEST_FATAL' }
    );
  }
}

/**
 * POST /api/public/news-digest
 *
 * Mirrors GET behavior (useful if you ever want to trigger this
 * from a form or a dashboard button).
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
