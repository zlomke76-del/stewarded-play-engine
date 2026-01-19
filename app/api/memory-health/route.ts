// app/api/memory-health/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV !== 'production';

function corsHeaders(origin: string | null): Headers {
  const h = new Headers();
  h.set('Vary', 'Origin');
  h.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type');
  h.set('Access-Control-Max-Age', '86400');
  if (origin) h.set('Access-Control-Allow-Origin', origin);
  return h;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabaseUrl || !hasServiceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Supabase env vars missing',
        timestamps: { server: new Date().toISOString() },
        env: { hasSupabaseUrl, hasServiceRoleKey },
        stats: null,
      },
      { status: 500, headers }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // These are “important” user keys we care about for sanity checks.
  const importantUserKeys = [
    'owner',
    'tim',
    'u_3646014e-95b0-40ab-9c70-4eb9168cd5e8', // Tim (browser)
    'u_0ec78c49-835c-4a55-82af-d33bc6c863cd', // Jemal
  ];

  let totalUserMemories: number | null = null;
  let totalClassifications: number | null = null;
  let unclassifiedCount: number | null = null;
  const byUserKey: Record<string, { memories: number }> = {};
  let rpcError: string | null = null;

  try {
    // Total user_memories
    {
      const { count, error } = await supabase
        .from('user_memories')
        .select('id', { head: true, count: 'exact' });

      if (error) throw error;
      totalUserMemories = count ?? 0;
    }

    // Total classifications
    {
      const { count, error } = await supabase
        .from('memory_classifications')
        .select('id', { head: true, count: 'exact' });

      if (error) throw error;
      totalClassifications = count ?? 0;
    }

    // Try to compute unclassified via RPC if the helper exists.
    // If it doesn't, we just record the error string.
    try {
      const { data, error } = await supabase.rpc('memories_needing_classification', {
        p_limit: 1,
        p_offset: 0,
      });
      if (error) {
        rpcError = error.message || String(error);
      } else if (Array.isArray(data)) {
        // RPC is expected to return rows; we just care about a count,
        // so we run a separate count query against that function if you add it later.
        unclassifiedCount = null;
      }
    } catch (e: any) {
      rpcError = e?.message || String(e);
      unclassifiedCount = null;
    }

    // Per-user counts for key identities (owner / tim / Jemal)
    for (const key of importantUserKeys) {
      try {
        const { count, error } = await supabase
          .from('user_memories')
          .select('id', { head: true, count: 'exact' })
          .eq('user_key', key);

        if (error) throw error;
        byUserKey[key] = { memories: count ?? 0 };
      } catch (e) {
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.error('memory-health per-user error', key, e);
        }
        byUserKey[key] = { memories: -1 };
      }
    }

    const ok = totalUserMemories !== null && totalUserMemories >= 0;

    const message = ok
      ? 'Memory pipeline reachable and user_memories present.'
      : 'Memory pipeline reachable but counts look suspicious.';

    return NextResponse.json(
      {
        ok,
        message,
        timestamps: { server: new Date().toISOString() },
        env: { hasSupabaseUrl, hasServiceRoleKey },
        stats: {
          totalUserMemories,
          totalClassifications,
          unclassifiedCount,
          byUserKey,
          rpcError,
        },
      },
      { headers }
    );
  } catch (err: any) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.error('memory-health fatal error:', err);
    }
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || String(err),
        timestamps: { server: new Date().toISOString() },
        env: { hasSupabaseUrl, hasServiceRoleKey },
        stats: null,
      },
      { status: 500, headers }
    );
  }
}
