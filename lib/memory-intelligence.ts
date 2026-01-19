// lib/memory-intelligence.ts
// Phase 4 — Memory Intelligence Core (Oversight + Classification + Ranking)

import "server-only";
import { classifyMemoryText } from "./memory-classifier";

/* ============================================================
   Types
   ============================================================ */

export type MemoryRecord = {
  id?: string;
  content: string;
  confidence?: number | null;
  importance?: number | null;
  emotional_weight?: number | null;
  sensitivity_score?: number | null;
  created_at?: string;
};

/* ============================================================
   WRITE-TIME CLASSIFICATION (adapter for tools.ts)
   ============================================================ */

export async function classifyMemoryAtWriteTime(
  content: string
) {
  const semantic = await classifyMemoryText(content);

  return {
    label: semantic.label,
    confidence: semantic.confidence,
    provider: semantic.provider,
    intent: "memory_write",
  };
}

/* ============================================================
   Oversight + Drift Analysis
   ============================================================ */

export function analyzeMemoryWrite(
  content: string,
  recent: MemoryRecord[]
) {
  const sensitivity = detectSensitivity(content);
  const emotional = detectEmotion(content);

  return {
    oversight: {
      store: sensitivity < 5,
      finalKind: sensitivity >= 4 ? "reference" : "note",
    },
    classification: {
      emotional,
      sensitivity,
    },
    lifecycle: {
      confidence: recent.length >= 2 ? 0.85 : 0.55,
    },
    drift: {
      detected: false,
    },
  };
}

/* ============================================================
   Memory Ranking (used by state-synthesizer)
   ============================================================ */

export function rankMemories(memories: MemoryRecord[]) {
  return memories
    .map((m) => {
      const confidence = m.confidence ?? 0;
      const importance = m.importance ?? 0;
      const emotional = m.emotional_weight ?? 0;

      const score =
        confidence * 0.5 +
        importance * 0.3 +
        emotional * 0.2;

      return {
        ...m,
        _score: score,
      };
    })
    .sort((a, b) => b._score - a._score);
}

/* ============================================================
   Internal heuristics (intentionally conservative)
   ============================================================ */

function detectSensitivity(text: string): number {
  const t = text.toLowerCase();
  if (t.includes("death") || t.includes("grief")) return 5;
  if (t.includes("medical") || t.includes("legal")) return 4;
  return 2;
}

function detectEmotion(text: string): number {
  const t = text.toLowerCase();
  if (t.includes("love") || t.includes("hate")) return 4;
  if (t.includes("excited") || t.includes("angry")) return 3;
  return 1;
}
