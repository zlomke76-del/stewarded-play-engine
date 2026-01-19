// lib/truth-ledger.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ResearchPack } from '@/lib/research';

type LogResearchArgs = {
  workspaceId: string | null;
  userKey: string | null;
  userId: string | null;
  query: string;
  researchPack: ResearchPack;
};

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !key) {
    console.error('[truth-ledger] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false },
  });

  return supabaseAdmin;
}

/**
 * Very simple, conservative Predictability Index based on number of distinct sources.
 * This is a placeholder until we wire in the full PI system.
 *
 * Rules:
 * - Base: 0.55
 * - +0.05 per source up to 7 → max ~0.90
 * - Clamp between 0.55 and 0.90
 */
function computePiFromSources(count: number): number {
  const n = Math.max(0, Math.min(count, 7));
  const pi = 0.55 + 0.05 * n;
  return Math.max(0.55, Math.min(pi, 0.9));
}

function classifyConfidence(pi: number): 'low' | 'medium' | 'high' {
  if (pi >= 0.85) return 'high';
  if (pi >= 0.70) return 'medium';
  return 'low';
}

/**
 * Log a research snapshot into the truth_facts table.
 * This does NOT yet declare anything as a hard "fact"; it stores a snapshot
 * with category='research_snapshot' and status based on PI.
 */
export async function logResearchSnapshot(args: LogResearchArgs): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const { workspaceId, userKey, userId, query, researchPack } = args;
    const sources = researchPack.bullets || [];
    const url = researchPack.url || null;
    const snapshot = researchPack.urlTextSnippet || null;

    const pi = computePiFromSources(sources.length);
    const confidence = classifyConfidence(pi);

    const status =
      pi >= 0.90
        ? 'candidate-fact' // still not canonical, but strong candidate
        : 'hypothesis';

    const summary = `Research snapshot for query: "${query}". ` +
      `Based on ${sources.length} external source(s). ` +
      `PI=${pi.toFixed(3)} (${confidence}).`;

    const sourcesPayload = sources.map((line, i) => ({
      label: `R${i + 1}`,
      line,
    }));

    const { error } = await supabase.from('truth_facts').insert({
      workspace_id: workspaceId ?? null,
      user_key: userKey ?? null,
      user_id: userId ?? null,
      query,
      summary,
      pi_score: pi,
      confidence_level: confidence,
      scientific_domain: null, // we can infer later
      category: 'research_snapshot',
      status,
      sources: sourcesPayload,
      raw_url: url,
      raw_snapshot: snapshot,
    });

    if (error) {
      console.error('[truth-ledger] Failed to insert research snapshot', error);
    }
  } catch (err) {
    console.error('[truth-ledger] Unexpected error logging research snapshot', err);
  }
}
