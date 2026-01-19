// lib/memory.ts
// Phase 4 — Ethical Memory Engine (Authoritative + Explainable)

import "server-only";
import { createClient } from "@supabase/supabase-js";

import { analyzeMemoryWrite } from "./memory-intelligence";
import { classifyMemoryText } from "./memory-classifier";
import {
  explainMemoryPromotion,
  buildExplanation,
} from "./explainability";

/* ============================================================
   Supabase (service role)
   ============================================================ */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/* ============================================================
   MEMORY WRITE — learning + promotion + explanation
   ============================================================ */

export async function remember({
  user_key,
  content,
  title = null,
  purpose = null, // hint only
  workspace_id = null,
}: {
  user_key: string;
  content: string;
  title?: string | null;
  purpose?: string | null;
  workspace_id?: string | null;
}) {
  /* ------------------------------------------------------------
     1. Fetch recent memory context
     ------------------------------------------------------------ */

  const { data: recent } = await supabase
    .from("user_memories")
    .select("*")
    .eq("user_key", user_key)
    .order("created_at", { ascending: false })
    .limit(10);

  /* ------------------------------------------------------------
     2. Epistemic analysis (oversight + drift)
     ------------------------------------------------------------ */

  const analysis = analyzeMemoryWrite(content, recent ?? []);

  if (!analysis.oversight.store) {
    return {
      stored: false,
      explanation: buildExplanation({
        type: "memory_block",
        summary: "Information was not stored.",
        details: ["Oversight rules prevented storage."],
      }),
    };
  }

  /* ------------------------------------------------------------
     3. Semantic classification
     ------------------------------------------------------------ */

  const semantic = await classifyMemoryText(content);

  /* ------------------------------------------------------------
     4. Confidence synthesis (learning signal)
     ------------------------------------------------------------ */

  const lifecycleConfidence = analysis.lifecycle.confidence;
  const semanticConfidence = semantic.confidence;
  const recentSignal = recent && recent.length > 0 ? 0.7 : 0.3;

  const confidence =
    0.4 * lifecycleConfidence +
    0.3 * semanticConfidence +
    0.3 * recentSignal;

  /* ------------------------------------------------------------
     5. Promotion logic (fact vs reference)
     ------------------------------------------------------------ */

  const promotedToFact = confidence >= 0.9;

  const finalKind = promotedToFact
    ? "fact"
    : analysis.oversight.finalKind ?? purpose ?? "note";

  /* ------------------------------------------------------------
     6. Explainability
     ------------------------------------------------------------ */

  const explanation = explainMemoryPromotion({
    promoted: promotedToFact,
    finalKind,
    confidence,
    lifecycleConfidence,
    semanticConfidence,
    recentSignal,
  });

  /* ------------------------------------------------------------
     7. Persist memory (append-only)
     ------------------------------------------------------------ */

  const { data, error } = await supabase
    .from("user_memories")
    .insert({
      user_key,
      title,
      content,
      kind: finalKind,
      confidence,
      importance: promotedToFact ? 5 : 3,
      emotional_weight: analysis.classification.emotional,
      sensitivity_score: analysis.classification.sensitivity,
      workspace_id,
      metadata: {
        purpose_hint: purpose,
        semantic,
        lifecycle: analysis.lifecycle,
        drift: analysis.drift,
        explainability: explanation, // stored, not auto-exposed
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[memory.remember] ${error.message}`);
  }

  /* ------------------------------------------------------------
     8. Return (caller decides visibility)
     ------------------------------------------------------------ */

  return {
    stored: true,
    memory: data,
    confidence,
    kind: finalKind,
    promotedToFact,
    explanation,
  };
}

/* ============================================================
   MEMORY SEARCH — ranked recall
   ============================================================ */

export async function searchMemories(
  user_key: string,
  query: string,
  limit = 8
) {
  const { data, error } = await supabase
    .from("user_memories")
    .select("*")
    .eq("user_key", user_key);

  if (error || !data) return [];

  const q = query.toLowerCase();

  return data
    .filter((m) => m.content?.toLowerCase().includes(q))
    .map((m) => ({
      ...m,
      _score:
        (m.importance ?? 0) +
        (m.confidence ?? 0) * 2,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}
