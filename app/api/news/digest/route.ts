// app/api/news/digest/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function jsonError(message: string, status = 500, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const daysParam = url.searchParams.get('days');
    const outletParam = url.searchParams.get('outlet');

    const limit = limitParam ? Math.max(1, Math.min(Number(limitParam) || 0, 100)) : 50;
    const days = daysParam ? Math.max(1, Math.min(Number(daysParam) || 0, 30)) : null;

    let query = supabaseAdmin
      .from('solace_news_digest_view')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (days) {
      query = query.gte('created_at', new Date(Date.now() - days * 86400000).toISOString());
    }

    if (outletParam) {
      query = query.eq('outlet', outletParam);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[news/digest] query error', error);
      return jsonError('Failed to load news digest.', 500, {
        code: error.code,
        details: error.details,
      });
    }

    return NextResponse.json({
      ok: true,
      count: data?.length || 0,
      stories: data ?? [],
    });
  } catch (err: any) {
    console.error('[news/digest] fatal error', err);
    return jsonError(err?.message || 'Unexpected error in news digest.', 500, {
      code: 'NEWS_DIGEST_FATAL',
    });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
