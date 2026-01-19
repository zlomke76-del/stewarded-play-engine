/* app/api/public/outlet-neutrality/route.ts */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ========= TYPES ========= */

type OutletRow = {
  outlet: string | null;
  outlet_normalized: string | null;
  total_stories: number | null;
  avg_bias_intent_score: number | null;
  avg_pi_score: number | null;
  min_bias_intent_score: number | null;
  max_bias_intent_score: number | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
};

type PublicOutletRow = {
  outlet: string;
  outlet_normalized: string;
  total_stories: number;
  avg_bias_intent_score: number;
  avg_pi_score: number;
  min_bias_intent_score: number;
  max_bias_intent_score: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
};

/* ========= ENV / SUPABASE INIT ========= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[public/outlet-neutrality] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – route will return 500 at runtime.',
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
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

function toNumber(
  raw: string | null,
  fallback: number,
  opts?: { min?: number; max?: number },
): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  let v = n;
  if (opts?.min != null) v = Math.max(opts.min, v);
  if (opts?.max != null) v = Math.min(opts.max, v);
  return v;
}

/* ========= HANDLER ========= */

/**
 * GET /api/public/outlet-neutrality
 *
 * Public, read-only view over outlet_neutrality_aggregates.
 *
 * Query params (all optional):
 * - min_stories: minimum number of stories required (default: 3)
 * - sort_by: one of "avg_bias_intent_score", "avg_pi_score", "total_stories"
 *            default: "avg_bias_intent_score"
 * - sort_dir: "asc" | "desc" (default: "asc" for bias; "desc" for pi/total)
 * - limit: max rows to return (default: 200, hard cap 500)
 */
export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return jsonError(
        'Supabase admin client not configured on server (missing env).',
        500,
        { code: 'NO_SUPABASE_ADMIN' },
      );
    }

    const url = new URL(req.url);

    const minStories = toNumber(url.searchParams.get('min_stories'), 3, {
      min: 1,
      max: 10_000,
    });

    const sortByRaw =
      url.searchParams.get('sort_by') ?? 'avg_bias_intent_score';
    const allowedSortBy = new Set([
      'avg_bias_intent_score',
      'avg_pi_score',
      'total_stories',
    ]);
    const sort_by = allowedSortBy.has(sortByRaw)
      ? sortByRaw
      : 'avg_bias_intent_score';

    const sortDirRaw = url.searchParams.get('sort_dir') ?? 'asc';
    const sort_dir = sortDirRaw === 'desc' ? 'desc' : 'asc';

    const limit = toNumber(url.searchParams.get('limit'), 200, {
      min: 1,
      max: 500,
    });

    // ========= QUERY =========
    // NOTE: we do NOT use a generic type parameter on .from(...)
    // to avoid the "Expected 2 type arguments, but got 1" error
    // with the Supabase v2 client + Database typing.
    let query = supabaseAdmin
      .from('outlet_neutrality_aggregates')
      .select(
        `
        outlet,
        outlet_normalized,
        total_stories,
        avg_bias_intent_score,
        avg_pi_score,
        min_bias_intent_score,
        max_bias_intent_score,
        first_seen_at,
        last_seen_at
      `,
      )
      .gte('total_stories', minStories);

    query = query.order(sort_by as string, {
      ascending: sort_dir === 'asc',
      nullsFirst: false,
    });

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('[public/outlet-neutrality] Supabase error', error);
      return jsonError(
        'Failed to load outlet neutrality aggregates.',
        500,
        { code: error.code, hint: error.hint, details: error.details },
      );
    }

    const outlets: PublicOutletRow[] = (data as OutletRow[]).map((row) => ({
      outlet: row.outlet ?? row.outlet_normalized ?? 'unknown',
      outlet_normalized: row.outlet_normalized ?? row.outlet ?? 'unknown',
      total_stories: row.total_stories ?? 0,
      avg_bias_intent_score: row.avg_bias_intent_score ?? 0,
      avg_pi_score: row.avg_pi_score ?? 0,
      min_bias_intent_score: row.min_bias_intent_score ?? 0,
      max_bias_intent_score: row.max_bias_intent_score ?? 0,
      first_seen_at: row.first_seen_at,
      last_seen_at: row.last_seen_at,
    }));

    return NextResponse.json({
      ok: true,
      meta: {
        min_stories: minStories,
        sort_by,
        sort_dir,
        limit,
        total: outlets.length,
        generated_at: new Date().toISOString(),
      },
      outlets,
    });
  } catch (err: any) {
    console.error('[public/outlet-neutrality] fatal error', err);
    return jsonError(
      err?.message || 'Unexpected error in outlet neutrality endpoint.',
      500,
      { code: 'OUTLET_NEUTRALITY_FATAL' },
    );
  }
}

/**
 * POST → same as GET (useful if you ever want to
 * trigger from forms / tools that prefer POST).
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
