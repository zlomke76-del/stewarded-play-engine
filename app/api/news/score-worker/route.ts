/* app/api/news/score-worker/route.ts */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type OpenAI from 'openai';
import { getOpenAI } from '@/lib/openai';

/* ========= ENV / SUPABASE INIT ========= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[news/score-worker] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing – route will return 500 at runtime.'
  );
}

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

/* ========= MODEL CONFIG ========= */

const SCORING_MODEL = process.env.OPENAI_SCORING_MODEL || 'gpt-4o';

/* ========= TYPES ========= */

type TruthFactRow = {
  id: string;
  workspace_id: string | null;
  user_key: string | null;
  user_id: string | null;
  query: string | null;
  summary: string | null;
  scientific_domain: string | null;
  category: string | null;
  status: string | null;
  sources: any;
  raw_url: string | null;
  raw_snapshot: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type NeutralBriefResult = {
  neutral_summary: string;
  key_facts: string[];
  context_background: string;
  stakeholder_positions: string;
  timeline: string;
  disputed_claims: string;
  omissions_detected: string;
  bias_language_score: number;
  bias_source_score: number;
  bias_framing_score: number;
  bias_context_score: number;
  bias_intent_score: number;
  pi_score: number;
  notes: string;
};

type ScoreBatchResult = {
  totalCandidates: number;
  scored: number;
  errors: string[];
  details: any[];
};

/* ========= HELPERS ========= */

function jsonError(
  message: string,
  status = 500,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

function safeNumber(v: any, fallback: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function outletFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

function clampText(text: string | null | undefined, max = 8000): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max) + '\n[...truncated for scoring...]';
}

/**
 * Compute bias_intent_score using the exact weights we defined:
 * - Language: 30%
 * - Source: 25%
 * - Framing: 25%
 * - Context: 20%
 */
function computeBiasIntentScore(parts: {
  language: number;
  source: number;
  framing: number;
  context: number;
}): number {
  const { language, source, framing, context } = parts;
  const raw =
    0.3 * language +
    0.25 * source +
    0.25 * framing +
    0.2 * context;

  const clamped = Math.min(3, Math.max(0, raw));
  return Math.round(clamped * 1000) / 1000;
}

/**
 * Predictability Index:
 * pi_score = 1 - (bias_intent_score / 3)
 */
function computePiScore(biasIntent: number): number {
  const pi = 1 - biasIntent / 3;
  const clamped = Math.min(1, Math.max(0, pi));
  return Math.round(clamped * 1000) / 1000;
}

/* ========= OPENAI NEUTRAL BRIEF + BIAS SCORING ========= */

async function scoreNewsStory(fact: TruthFactRow): Promise<NeutralBriefResult | null> {
  const openai: OpenAI = await getOpenAI();

  const title =
    fact.summary?.split('\n')[0]?.trim() ||
    '(untitled story)';
  const url = fact.raw_url || '';
  const outlet = outletFromUrl(url) || 'unknown-outlet';

  const body = clampText(fact.raw_snapshot || fact.summary || '', 6000);

  if (!body.trim()) {
    console.warn('[news/score-worker] Empty body for truth_fact id', fact.id);
    return null;
  }

  const instruction = `
You are a neutral media analyst applying the Moral Clarity AI Neutral News Protocol v1.0.

You will read a news story snapshot and produce:
1) A neutral, bias-minimized summary (200–400 words).
2) A structured Neutral Brief with:
   - key_facts: 5–10 concise, checkable facts.
   - context_background: what prior events / history are needed to understand this.
   - stakeholder_positions: what the major actors or sides are claiming.
   - timeline: ordered bullet-style description of key events (or "N/A" if not temporal).
   - disputed_claims: which claims are contested or reported differently elsewhere.
   - omissions_detected: important context that appears likely missing.

3) Bias intent scores (0.0–3.0) on four components:
   - bias_language_score
   - bias_source_score
   - bias_framing_score
   - bias_context_score

Definitions (0 = no bias, 3 = strong bias):

1) bias_language_score (0–3)
   - Measures emotionally charged, loaded, or inflammatory language.
   - 0 = strictly neutral wording.
   - 1 = mild emotional shading.
   - 2 = clearly slanted or emotionally loaded.
   - 3 = heavily propagandistic or inflammatory language.

2) bias_source_score (0–3)
   - Measures how balanced and credible the sources appear.
   - 0 = multiple credible, diverse sources; clearly attributed.
   - 1 = mostly credible, mild skew or limited diversity.
   - 2 = few sources, one-sided, or questionable credibility.
   - 3 = no credible sources or extremely one-sided.

3) bias_framing_score (0–3)
   - Measures how the story frames events and actors (heroes/villains, good/evil).
   - 0 = balanced framing with multiple perspectives.
   - 1 = slight tilt in framing.
   - 2 = clearly one-sided framing.
   - 3 = overtly adversarial/cheerleading framing.

4) bias_context_score (0–3)
   - Measures omission or distortion of important context.
   - 0 = context is thorough and fair.
   - 1 = minor missing context.
   - 2 = important context is missing or downplayed.
   - 3 = critical context omitted or the story is highly misleading by omission.

You are NOT judging whether the story is true or false.
You are measuring *how* it is told, and what is included or omitted.

Compute:
- bias_language_score
- bias_source_score
- bias_framing_score
- bias_context_score

Then compute bias_intent_score using this exact formula:
  bias_intent_score =
    0.30 * bias_language_score +
    0.25 * bias_source_score +
    0.25 * bias_framing_score +
    0.20 * bias_context_score

Also compute pi_score (0–1) as how predictable / neutral the article is:
  pi_score = 1 - (bias_intent_score / 3)

Return ONLY a JSON object with this exact structure:

{
  "neutral_summary": "200-400 word neutral summary...",
  "key_facts": ["fact 1", "fact 2", "..."],
  "context_background": "string",
  "stakeholder_positions": "string",
  "timeline": "string",
  "disputed_claims": "string",
  "omissions_detected": "string",
  "bias_language_score": 0.0,
  "bias_source_score": 0.0,
  "bias_framing_score": 0.0,
  "bias_context_score": 0.0,
  "bias_intent_score": 0.0,
  "pi_score": 0.5,
  "notes": "One or two sentences explaining your scoring."
}

- Do not include any extra top-level keys.
- If uncertainty is high (e.g., very short article), say so in "notes" and use conservative mid-range scores around 1.0–1.5.
`.trim();

  const articleBlock = `
ARTICLE_TITLE: ${title}
OUTLET: ${outlet}
URL: ${url || '(none)'}

ARTICLE_BODY_SNAPSHOT:
"""
${body}
"""
`.trim();

  const resp = await openai.responses.create({
    model: SCORING_MODEL,
    input: `${instruction}\n\n${articleBlock}`,
    max_output_tokens: 1000,
  });

  const rawText = (resp as any).output_text as string | undefined;
  if (!rawText) {
    console.error('[news/score-worker] No output_text from model for truth_fact id', fact.id);
    return null;
  }

  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('[news/score-worker] Failed to parse JSON for truth_fact id', fact.id, cleaned);
    return null;
  }

  const neutral_summary: string = String(parsed.neutral_summary || '').trim();
  const key_facts: string[] = Array.isArray(parsed.key_facts)
    ? parsed.key_facts.map((f: any) => String(f || '').trim()).filter(Boolean)
    : [];
  const context_background: string = String(parsed.context_background || '').trim();
  const stakeholder_positions: string = String(parsed.stakeholder_positions || '').trim();
  const timeline: string = String(parsed.timeline || '').trim();
  const disputed_claims: string = String(parsed.disputed_claims || '').trim();
  const omissions_detected: string = String(parsed.omissions_detected || '').trim();

  const bias_language_score = safeNumber(parsed.bias_language_score, 1.5, 0, 3);
  const bias_source_score = safeNumber(parsed.bias_source_score, 1.5, 0, 3);
  const bias_framing_score = safeNumber(parsed.bias_framing_score, 1.5, 0, 3);
  const bias_context_score = safeNumber(parsed.bias_context_score, 1.5, 0, 3);

  // Recompute bias_intent_score ourselves to enforce exact formula
  const bias_intent_score = computeBiasIntentScore({
    language: bias_language_score,
    source: bias_source_score,
    framing: bias_framing_score,
    context: bias_context_score,
  });

  // Compute pi_score deterministically
  const pi_score = computePiScore(bias_intent_score);

  const notes: string = String(parsed.notes || '').trim();

  if (!neutral_summary) {
    console.warn('[news/score-worker] Missing neutral_summary for truth_fact id', fact.id);
  }

  return {
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
    notes,
  };
}

/* ========= CORE WORKFLOW ========= */

async function fetchUnscoredTruthFacts(limit: number): Promise<TruthFactRow[]> {
  if (!supabaseAdmin) return [];

  // 1) Pull recent news snapshots from truth_facts
  const { data: facts, error } = await supabaseAdmin
    .from('truth_facts')
    .select('*')
    .eq('scientific_domain', 'news')
    .eq('category', 'news_story')
    .order('created_at', { ascending: false })
    .limit(limit * 3);

  if (error) {
    console.error('[news/score-worker] Failed to fetch truth_facts', error);
    return [];
  }

  const result: TruthFactRow[] = [];

  // 2) Filter those that do NOT yet have a row in news_neutrality_ledger
  for (const fact of facts as TruthFactRow[]) {
    if (!fact.id) continue;

    const { data: existing, error: existErr } = await supabaseAdmin
      .from('news_neutrality_ledger')
      .select('id')
      .eq('truth_fact_id', fact.id)
      .maybeSingle();

    // PGRST116 is "No rows found" – this is fine.
    if (existErr && existErr.code !== 'PGRST116') {
      console.error('[news/score-worker] news_neutrality_ledger check error', existErr);
      continue;
    }

    if (existing && (existing as any).id) {
      continue;
    }

    result.push(fact);

    if (result.length >= limit) break;
  }

  return result;
}

async function scoreBatch(limit: number): Promise<ScoreBatchResult> {
  if (!supabaseAdmin) {
    throw new Error(
      '[news/score-worker] Supabase admin client not initialized – missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  const toScore = await fetchUnscoredTruthFacts(limit);
  if (!toScore.length) {
    return {
      totalCandidates: 0,
      scored: 0,
      errors: [],
      details: [],
    };
  }

  let scored = 0;
  const errors: string[] = [];
  const details: any[] = [];

  for (const fact of toScore) {
    try {
      const scoring = await scoreNewsStory(fact);
      if (!scoring) {
        errors.push(`No scoring result for truth_fact_id=${fact.id}`);
        continue;
      }

      const outlet = outletFromUrl(fact.raw_url);
      const nowIso = new Date().toISOString();

      const rowToInsert: Record<string, any> = {
        workspace_id: fact.workspace_id || 'global_news',
        user_key: fact.user_key || 'system-news-anchor',
        user_id: fact.user_id || null,

        truth_fact_id: fact.id,
        story_id: fact.raw_url || fact.id,
        story_title: fact.summary || '(untitled story)',
        story_url: fact.raw_url,
        outlet,

        category: 'news_story',

        // Neutral Brief fields
        neutral_summary: scoring.neutral_summary,
        key_facts: scoring.key_facts,
        context_background: scoring.context_background,
        stakeholder_positions: scoring.stakeholder_positions,
        timeline: scoring.timeline,
        disputed_claims: scoring.disputed_claims,
        omissions_detected: scoring.omissions_detected,

        // Raw story snapshot for reference
        raw_story: fact.raw_snapshot || fact.summary,

        // Bias scores
        bias_language_score: scoring.bias_language_score,
        bias_source_score: scoring.bias_source_score,
        bias_framing_score: scoring.bias_framing_score,
        bias_context_score: scoring.bias_context_score,
        bias_intent_score: scoring.bias_intent_score,
        pi_score: scoring.pi_score,

        notes: scoring.notes || null,

        created_at: nowIso,
        updated_at: nowIso,
      };

      const { error: insertErr } = await supabaseAdmin
        .from('news_neutrality_ledger')
        .insert(rowToInsert);

      if (insertErr) {
        console.error('[news/score-worker] news_neutrality_ledger insert error', {
          truth_fact_id: fact.id,
          message: insertErr.message,
          code: insertErr.code,
        });
        errors.push(
          `Insert error for truth_fact_id=${fact.id}: ${insertErr.code || ''} ${insertErr.message}`
        );
        continue;
      }

      scored++;
      details.push({
        truth_fact_id: fact.id,
        story_url: fact.raw_url,
        outlet,
        bias_intent_score: scoring.bias_intent_score,
        bias_language_score: scoring.bias_language_score,
        bias_source_score: scoring.bias_source_score,
        bias_framing_score: scoring.bias_framing_score,
        bias_context_score: scoring.bias_context_score,
        pi_score: scoring.pi_score,
      });
    } catch (err: any) {
      console.error('[news/score-worker] Fatal scoring error for truth_fact_id', fact.id, err);
      errors.push(
        `Fatal scoring error for truth_fact_id=${fact.id}: ${err?.message || String(err)}`
      );
    }
  }

  return {
    totalCandidates: toScore.length,
    scored,
    errors,
    details,
  };
}

/* ========= HANDLERS ========= */

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
    const limit = limitParam ? Math.max(1, Math.min(Number(limitParam) || 0, 50)) : 20;

    const startedAt = new Date().toISOString();
    const result = await scoreBatch(limit);
    const finishedAt = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      model: SCORING_MODEL,
      startedAt,
      finishedAt,
      limit,
      ...result,
    });
  } catch (err: any) {
    console.error('[news/score-worker] fatal error', err);
    return jsonError(
      err?.message || 'Unexpected error in news score worker.',
      500,
      { code: 'NEWS_SCORE_FATAL' }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
