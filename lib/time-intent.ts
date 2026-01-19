// lib/time-intent.ts
import "server-only";

export type TimeIntent =
  | { mode: "current" }
  | { mode: "relative"; days: number }
  | { mode: "absolute"; from: string; to?: string }
  | { mode: "last_occurrence" };

export function parseTimeIntent(text: string): TimeIntent {
  const t = text.toLowerCase();

  if (t.includes("where are we at") || t.includes("current")) {
    return { mode: "current" };
  }

  const rel = t.match(/(\d+)\s+(day|week|month|year)s?\s+ago/);
  if (rel) {
    const n = Number(rel[1]);
    const unit = rel[2];
    const days =
      unit === "day"
        ? n
        : unit === "week"
        ? n * 7
        : unit === "month"
        ? n * 30
        : n * 365;

    return { mode: "relative", days };
  }

  if (t.includes("last time")) {
    return { mode: "last_occurrence" };
  }

  return { mode: "current" };
}
