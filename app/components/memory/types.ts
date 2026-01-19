// app/components/memory/types.ts

export type MemoryContent =
  | string
  | Record<string, unknown>
  | null;

export type MemoryRecord = {
  id: string;
  content: MemoryContent;
  created_at: string;
  updated_at: string;
};
