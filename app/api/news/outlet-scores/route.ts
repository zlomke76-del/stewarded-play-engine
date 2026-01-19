/* app/api/news/outlet-scores/route.ts */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* ========= ENV / SUPABASE INIT ========= */

const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
const SUPABASE_SERVICE_ROLE_KEY = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[news/outlet-scores] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – route will return 500 at runtime.'
  );
}

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      '[news/outlet-scores] Supabase admin credentials not configured'
    );
  }
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return supabaseAdmin;
}

/* ========= TYPES (MATCH THE VIEW) ========= */

type OutletScoreRow = {
  outlet: string | null;
  outlet_group: string | null;
  story_count: number | null;

  avg_bias_language: number | null;
  avg_bias_source: number | null;
  avg_bias_framing: number | null;
  avg_bias_context: number | null;
  avg_bias_intent: number | null;

  avg_pi: number | null;
  neutrality_index: number | null; // 0–100
};

type OutletScore = {
  outlet: string;
  outlet_group: string;
  story_count: number;

  avg_bias_language: number | null;
  avg_bias_source: number | null;
  avg_bias_framing: number | null;
  avg_bias_context: number | null;
  avg_bias_intent: number | null;

  avg_pi: number | null;          // 0–1
  neutrality_index: number | null; // 0–100

  // grade is optional for now; we can tune thresholds later
  grade: string | null;
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

function parseNumberParam(
  params: URLSearchParams,
  key: string,
  fallback: number
): number {
  const raw = params.get(key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseStringParam(
  params: URLSearchParams,
  key: string,
  allowed: string[] | null,
  fallback: string
): string {
  const raw = (params.get(key) || '').trim().toLowerCase();
  if (!raw) return fallback;
  if (!allowed) return raw;
  return allowed.includes(raw) ? raw : fallback;
}

/**
 * Simple, *tunable* grade helper.
 * We can revisit thresholds when we lock the public rubric.
 */
function computeGrade(row: OutletScoreRow): string | null {
  const n = row.story_count ?? 0;
  const neutrality = row.neutrality_index ?? null;
  const pi = row.avg_pi ?? null;

  // Not enough data to grade
  if (n < 5 || neutrality === null || pi === null) return null;

  // Normalize PI to 0–100 for gating
  const pi100 = pi * 100;

  if (neutrality >= 80 && pi100 >= 75) return 'A';
  if (neutrality >= 70) return 'B';
  if (neutrality >= 60) return 'C';
  if (neutrality >= 45) return 'D';
  return 'F';
}

function mapRow(row: OutletScoreRow): OutletScore {
  return {
    outlet: (row.outlet || '').trim() || '(unknown outlet)',
    outlet_group: (row.outlet_group || 'other').toLowerCase(),
    story_count: row.story_count ?? 0,

    avg_bias_language: row.avg_bias_language,
    avg_bias_source: row.avg_bias_source,
    avg_bias_framing: row.avg_bias_framing,
    avg_bias_context: row.avg_bias_context,
    avg_bias_intent: row.avg_bias_intent,

    avg_pi: row.avg_pi,
    neutrality_index: row.neutrality_index,

    grade: computeGrade(row),
  };
}

/* ========= CORE FETCH ========= */

async function fetchOutletScores(opts: {
  minStories: number;
  limit: number;
  groupFilter: string | null;
  orderBy: 'neutrality' | 'pi' | 'stories' | 'name';
  direction: 'asc' | 'desc';
}): Promise<OutletScore[]> {
  const supabase = getSupabaseAdmin();

  // Map friendly order key → column name
  const orderColumn =
    opts.orderBy === 'neutrality'
      ? 'neutrality_index'
      : opts.orderBy === 'pi'
      ? 'avg_pi'
      : opts.orderBy === 'stories'
      ? 'story_count'
      : 'outlet';

  let query = supabase
    .from('vw_outlet_neutrality_scores')
    .select('*')
    .gte('story_count', opts.minStories)
    .order(orderColumn, { ascending: opts.direction === 'asc' })
    .limit(opts.limit);

  if (opts.groupFilter && opts.groupFilter !== 'all') {
    query = query.eq('outlet_group', opts.groupFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[news/outlet-scores] Supabase view error', error);
    throw new Error(
      `Failed to load vw_outlet_neutrality_scores: ${error.message || 'unknown error'}`
    );
  }

  const rows = (data || []) as OutletScoreRow[];
  return rows.map(mapRow);
}

/* ========= HANDLERS ========= */

/**
 * GET /api/news/outlet-scores
 *
 * Query params (all optional):
 * - min_stories: minimum story_count to include (default 5)
 * - limit: max outlets to return (default 200)
 * - group: one of wire|left|right|global|other|all (default all)
 * - order: neutrality|pi|stories|name (default neutrality)
 * - dir: asc|desc (default desc)
 */
export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError(
        'Supabase admin client not configured on server (missing env).',
        500,
        { code: 'NO_SUPABASE_ADMIN' }
      );
    }

    const params = req.nextUrl.searchParams;

    const minStories = parseNumberParam(params, 'min_stories', 5);
    const limit = parseNumberParam(params, 'limit', 200);

    const groupFilter = parseStringParam(
      params,
      'group',
      ['wire', 'left', 'right', 'global', 'other', 'all'],
      'all'
    );

    const orderBy = parseStringParam(
      params,
      'order',
      ['neutrality', 'pi', 'stories', 'name'],
      'neutrality'
    ) as 'neutrality' | 'pi' | 'stories' | 'name';

    const direction = parseStringParam(
      params,
      'dir',
      ['asc', 'desc'],
      'desc'
    ) as 'asc' | 'desc';

    const rows = await fetchOutletScores({
      minStories,
      limit,
      groupFilter,
      orderBy,
      direction,
    });

    return NextResponse.json({
      ok: true,
      filters: {
        min_stories: minStories,
        limit,
        group: groupFilter,
        order: orderBy,
        dir: direction,
      },
      total: rows.length,
      outlets: rows,
    });
  } catch (err: any) {
    console.error('[news/outlet-scores] fatal error', err);
    return jsonError(
      err?.message || 'Unexpected error in outlet-scores route.',
      500,
      { code: 'NEWS_OUTLET_SCORES_FATAL' }
    );
  }
}

/**
 * Optional: POST → same behavior, to allow internal MCAI calls via POST.
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
