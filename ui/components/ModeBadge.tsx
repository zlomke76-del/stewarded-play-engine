import React from "react";

export function ModeBadge({ mode, confidence }: { mode: "Neutral"|"Guidance"|"Ministry"; confidence: number }) {
  const palette = {
    Neutral:  "bg-blue-100 text-blue-800 border-blue-200",
    Guidance: "bg-amber-100 text-amber-900 border-amber-200",
    Ministry: "bg-violet-100 text-violet-900 border-violet-200",
  }[mode];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${palette}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {mode} • {confidence.toFixed(2)}
    </span>
  );
}
