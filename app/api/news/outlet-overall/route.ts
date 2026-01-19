/* app/api/news/outlet-overall/route.ts */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[news/outlet-overall] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – route will 500 at runtime.'
  );
}

function jsonError(message: string, status = 500, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function GET(_req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError(
        'Supabase admin client not configured on server (missing env).',
        500,
        { code: 'NO_SUPABASE_ADMIN' }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('outlet_bias_pi_overall')
      .select('*')
      .order('avg_pi_score', { ascending: false });

    if (error) {
      console.error('[news/outlet-overall] query error', error);
      return jsonError('Failed to load outlet bias overview.', 500, {
        code: error.code,
        details: error.details,
      });
    }

    return NextResponse.json({
      ok: true,
      count: data?.length ?? 0,
      outlets: data ?? [],
    });
  } catch (err: any) {
    console.error('[news/outlet-overall] fatal error', err);
    return jsonError(err?.message || 'Unexpected error in outlet-overall.', 500, {
      code: 'OUTLET_OVERALL_FATAL',
    });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
