/* app/api/news/outlet-daily/route.ts */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[news/outlet-daily] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – route will 500 at runtime.'
  );
}

function jsonError(message: string, status = 500, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError(
        'Supabase admin client not configured on server (missing env).',
        500,
        { code: 'NO_SUPABASE_ADMIN' }
      );
    }

    const url = new URL(req.url);
    const outlet = url.searchParams.get('outlet'); // optional filter
    const daysParam = url.searchParams.get('days');
    const days = daysParam ? Math.max(1, Math.min(Number(daysParam) || 0, 90)) : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    let query = supabase
      .from('outlet_bias_pi_daily_trends')
      .select('*')
      .order('story_day', { ascending: true })
      .order('outlet', { ascending: true });

    if (outlet) {
      query = query.eq('outlet', outlet);
    }

    if (days) {
      const since = new Date(Date.now() - days * 86400_000)
        .toISOString()
        .slice(0, 10);
      query = query.gte('story_day', since);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[news/outlet-daily] query error', error);
      return jsonError('Failed to load daily outlet trends.', 500, {
        code: error.code,
        details: error.details,
      });
    }

    return NextResponse.json({
      ok: true,
      count: data?.length ?? 0,
      rows: data ?? [],
    });
  } catch (err: any) {
    console.error('[news/outlet-daily] fatal error', err);
    return jsonError(err?.message || 'Unexpected error in outlet-daily.', 500, {
      code: 'OUTLET_DAILY_FATAL',
    });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
