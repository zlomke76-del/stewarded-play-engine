/* app/api/public/system-news-digest/route.ts */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ========= ENV / SUPABASE INIT ========= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[public/system-news-digest] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – route will 500 at runtime.'
  );
}

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

/* ========= TYPES ========= */

type DigestRow = {
  id: string;
  outlet: string | null;
  title: string | null;
  summary: string | null;
  created_at: string;
};

/* ========= HELPERS ========= */

function jsonError(
  message: string,
  status = 500,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/* ========= CORE QUERY ========= */

async function fetchSystemNewsDigest(opts: {
  limit: number;
  hoursBack: number;
}): Promise<{ rows: DigestRow[] }> {
  if (!supabaseAdmin) {
    throw new Error(
      '[public/system-news-digest] Supabase admin client not initialized – missing env.',
    );
  }

  const { limit, hoursBack } = opts;

  // Window: last N hours (default 24)
  const sinceIso = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
    .toISOString();

  let query = supabaseAdmin
    .from('system_news_digest_view')
    .select('*')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('[public/system-news-digest] Supabase error', error);
    throw new Error(error.message);
  }

  return { rows: (data ?? []) as DigestRow[] };
}

/* ========= HANDLERS ========= */

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

    const limitParam = url.searchParams.get('limit');
    const hoursParam = url.searchParams.get('hours');

    const limit = limitParam
      ? Math.max(1, Math.min(Number(limitParam) || 0, 50))
      : 20;

    // default: last 24h
    const hoursBack = hoursParam
      ? Math.max(1, Math.min(Number(hoursParam) || 0, 72))
      : 24;

    const startedAt = new Date().toISOString();
    const { rows } = await fetchSystemNewsDigest({ limit, hoursBack });
    const finishedAt = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      startedAt,
      finishedAt,
      limit,
      hoursBack,
      count: rows.length,
      items: rows,
    });
  } catch (err: any) {
    console.error('[public/system-news-digest] fatal error', err);
    return jsonError(
      err?.message || 'Unexpected error in system news digest route.',
      500,
      { code: 'SYSTEM_NEWS_DIGEST_FATAL' },
    );
  }
}

export async function POST(req: NextRequest) {
  // Allow POST to behave the same as GET (for dashboards, buttons, etc.)
  return GET(req);
}
