// lib/state-synthesizer.ts
// Phase 6 — State Synthesis Engine

import "server-only";
import { rankMemories } from "./memory-intelligence";

export function synthesizeState(params: {
  memories: any[];
  from?: Date;
  to?: Date;
}) {
  const filtered = params.memories.filter((m) => {
    const t = new Date(m.created_at).getTime();
    if (params.from && t < params.from.getTime()) return false;
    if (params.to && t > params.to.getTime()) return false;
    return true;
  });

  const ranked = rankMemories(filtered).slice(0, 10);

  const summary = ranked
    .map((m) => m.content)
    .slice(0, 3)
    .join(" ");

  return {
    timeframe: {
      from: params.from?.toISOString() ?? "recent",
      to: params.to?.toISOString() ?? "now",
      mode: params.from || params.to ? "historical" : "current",
    },
    orientation: {
      summary,
      confidence:
        ranked.reduce((a, b) => a + (b.confidence ?? 0), 0) /
        Math.max(1, ranked.length),
    },
    active_threads: ranked.map((m) => ({
  label: m.content.slice(0, 60), // or a smarter summarizer later
  status: "active",
  last_update: m.created_at,
})),
    explanation_available: true,
  };
}
