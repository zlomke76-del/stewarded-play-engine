// lib/memory/types.ts
// ============================================================
// MEMORY TYPES — CANONICAL
// ============================================================

export type MemoryContent =
  | string
  | Record<string, any>
  | null;

export interface MemoryRecord {
  id: string;
  user_id: string;
  workspace_id: string;
  content: MemoryContent;
  created_at: string;
  updated_at: string;
}
