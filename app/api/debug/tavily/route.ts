// app/api/debug/tavily/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { webSearch } from '@/lib/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get('q') || 'US news headlines today';
  const newsParam = searchParams.get('news');
  const maxParam = searchParams.get('max');
  const daysParam = searchParams.get('days');

  const news = newsParam === '1' || newsParam === 'true';
  const max = maxParam ? Number(maxParam) || undefined : undefined;
  const days = daysParam ? Number(daysParam) || undefined : undefined;

  try {
    const results = await webSearch(q, { news, max, days });

    return NextResponse.json(
      {
        ok: true,
        query: q,
        options: { news, max, days },
        count: results.length,
        results,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[debug/tavily] Error invoking webSearch', err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
