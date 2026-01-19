/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin credentials not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// Reasonable defaults
const DEFAULT_CATEGORIES = ['us', 'world', 'politics', 'economy', 'technology', 'health'];

type StoryWithSnapshot = {
  id: string;
  title: string;
  category: string | null;
  source_url: string;
  published_at: string | null;
  outlet: {
    id: string;
    name: string | null;
    domain: string | null;
  } | null;
  snapshot: {
    id: string;
    neutral_summary: string;
    bias_intent_score: number;
    pi_score: number | null;
    confidence_level: string | null;
    source_urls: string[];
  } | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const url = new URL(req.url);
    const categoriesParam = url.searchParams.get('categories');
    const limitParam = url.searchParams.get('limit');
    const perCategory = Math.max(1, Math.min(Number(limitParam) || 4, 6));

    const categories = categoriesParam
      ? categoriesParam
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : DEFAULT_CATEGORIES;

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0
    ).toISOString();

    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    ).toISOString();

    // We’ll pull per-category to keep control of counts.
    const out: Record<string, StoryWithSnapshot[]> = {};

    for (const cat of categories) {
      const { data, error } = await supabase
        .from('news_stories')
        .select(
          `
          id,
          title,
          category,
          source_url,
          published_at,
          news_outlets:outlet_id (
            id,
            name,
            domain
          ),
          news_snapshots!inner (
            id,
            neutral_summary,
            bias_intent_score,
            pi_score,
            confidence_level,
            source_urls,
            is_current,
            created_at
          )
        `
        )
        .eq('category', cat)
        .gte('published_at', startOfDay)
        .lte('published_at', endOfDay)
        .eq('news_snapshots.is_current', true)
        .order('published_at', { ascending: false })
        .limit(perCategory);

      if (error) {
        console.error(`news/today error for category ${cat}`, error);
        out[cat] = [];
        continue;
      }

      const mapped: StoryWithSnapshot[] =
        (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          source_url: row.source_url,
          published_at: row.published_at,
          outlet: row.news_outlets
            ? {
                id: row.news_outlets.id,
                name: row.news_outlets.name,
                domain: row.news_outlets.domain,
              }
            : null,
          snapshot: row.news_snapshots
            ? {
                id: row.news_snapshots.id,
                neutral_summary: row.news_snapshots.neutral_summary,
                bias_intent_score: row.news_snapshots.bias_intent_score,
                pi_score: row.news_snapshots.pi_score,
                confidence_level: row.news_snapshots.confidence_level,
                source_urls: row.news_snapshots.source_urls || [row.source_url],
              }
            : null,
        })) ?? [];

      out[cat] = mapped;
    }

    // Response format: exactly what Solace / UI needs for “neutral news today”
    return NextResponse.json({
      ok: true,
      date: today.toISOString().slice(0, 10),
      categories,
      per_category_limit: perCategory,
      stories: out,
    });
  } catch (err: any) {
    console.error('news/today error', err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
