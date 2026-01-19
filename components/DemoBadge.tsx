// components/DemoBadge.tsx
"use client";

export default function DemoBadge() {
  if (typeof window === "undefined") return null;

  const isDemo = document.cookie.split("; ").some((c) => c === "mcai_demo=1");
  if (!isDemo) return null;

  return (
    <span className="ml-2 rounded border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
      Demo
    </span>
  );
}
