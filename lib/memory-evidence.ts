// lib/memory-evidence.ts
// Phase 4.5 — Memory Evidence Shape (Read-only, Non-Authoritative)

import "server-only";

export type MemoryEvidence = {
  id?: string;
  content: string;

  created_at?: string;

  confidence?: number | null;
  importance?: number | null;

  emotional_weight?: number | null;
  sensitivity_score?: number | null;

  // Internal scoring used ONLY for recall ranking
  _score?: number;
};
