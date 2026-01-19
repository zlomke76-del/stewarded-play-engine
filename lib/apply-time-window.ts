// lib/apply-time-window.ts
import "server-only";
import type { MemoryEvidence } from "./memory-evidence";
import type { TimeIntent } from "./time-intent";

export function applyTimeWindow(
  memories: MemoryEvidence[],
  intent: TimeIntent
): MemoryEvidence[] {
  if (intent.mode === "current") {
    return memories;
  }

  if (intent.mode === "last_occurrence") {
    return memories.slice(0, 1);
  }

  if (intent.mode === "relative") {
    const cutoff = Date.now() - intent.days * 86400000;
    return memories.filter((m) =>
      m.created_at ? new Date(m.created_at).getTime() >= cutoff : false
    );
  }

  if (intent.mode === "absolute") {
    const from = new Date(intent.from).getTime();
    const to = intent.to ? new Date(intent.to).getTime() : Date.now();
    return memories.filter((m) => {
      if (!m.created_at) return false;
      const t = new Date(m.created_at).getTime();
      return t >= from && t <= to;
    });
  }

  return memories;
}
