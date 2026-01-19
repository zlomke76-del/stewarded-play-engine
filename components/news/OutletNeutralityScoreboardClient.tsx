"use client";

import { useEffect, useState } from "react";

/* ========= TYPES (MATCH YOUR API) ========= */

type OutletNeutralityApiItem = {
  outlet: string;
  outlet_normalized: string;
  total_stories: number;
  avg_bias_intent_score: number;
  avg_pi_score: number;
  min_bias_intent_score: number;
  max_bias_intent_score: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
};

type OutletNeutralityApiMeta = {
  min_stories: number;
  sort_by: string;
  sort_dir: "asc" | "desc";
  limit: number;
  total: number;
  generated_at: string;
};

type OutletNeutralityApiResponse = {
  ok: boolean;
  meta: OutletNeutralityApiMeta;
  outlets: OutletNeutralityApiItem[];
};

export type OutletNeutralityItem = OutletNeutralityApiItem;

type SortMode = "stories" | "bias-low" | "predictability";

/* ========= HELPERS ========= */

function scoreLabel(score: number): "Low" | "Medium" | "High" {
  if (score <= 0.33) return "Low";
  if (score <= 0.66) return "Medium";
  return "High";
}

function formatDateShort(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return null;
  }
}

function sortModeToParams(mode: SortMode): {
  sort_by: string;
  sort_dir: "asc" | "desc";
} {
  switch (mode) {
    case "bias-low":
      return { sort_by: "avg_bias_intent_score", sort_dir: "asc" };
    case "predictability":
      return { sort_by: "avg_pi_score", sort_dir: "desc" };
    case "stories":
    default:
      return { sort_by: "total_stories", sort_dir: "desc" };
  }
}

/* ========= COMPONENT ========= */

type OutletNeutralityScoreboardClientProps = {
  limit?: number;
  minStories?: number;
  className?: string;
};

export function OutletNeutralityScoreboardClient({
  limit = 200,
  minStories = 3,
  className,
}: OutletNeutralityScoreboardClientProps) {
  const [items, setItems] = useState<OutletNeutralityItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("stories");
  const [meta, setMeta] = useState<OutletNeutralityApiMeta | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const { sort_by, sort_dir } = sortModeToParams(sortMode);

        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("min_stories", String(minStories));
        params.set("sort_by", sort_by);
        params.set("sort_dir", sort_dir);

        const res = await fetch(
          `/api/public/outlet-neutrality?${params.toString()}`
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `HTTP ${res.status} while loading outlet neutrality scoreboard: ${text}`
          );
        }

        const json = (await res.json()) as OutletNeutralityApiResponse;

        if (!json.ok) {
          throw new Error(
            "API returned ok=false for outlet neutrality aggregates."
          );
        }

        if (!cancelled) {
          setItems(json.outlets || []);
          setMeta(json.meta);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load outlet neutrality scoreboard.");
          setItems([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [limit, minStories, sortMode]);

  if (loading && !items) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-6 text-sm text-slate-300">
          Loading outlet neutrality scoreboard…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-red-900/60 bg-red-950/70 px-4 py-6 text-sm text-red-100">
          <div className="font-semibold">
            Unable to load outlet neutrality scoreboard.
          </div>
          <div className="mt-1 text-xs opacity-80">{err}</div>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-6 text-sm text-slate-300">
          No outlet aggregates are available yet.
        </div>
      </div>
    );
  }

  const generatedAt = meta ? formatDateShort(meta.generated_at) : null;

  return (
    <div className={className}>
      {/* Header + Controls */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Outlet Neutrality Scoreboard
          </div>
          <div className="text-[11px] text-slate-500">
            Lifetime bias &amp; predictability across all scored stories.
          </div>
          {generatedAt && (
            <div className="text-[11px] text-slate-600">
              Updated {generatedAt} · min {meta?.min_stories ?? minStories}{" "}
              stories/outlet
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Sort by</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 shadow-sm focus:border-slate-400 focus:outline-none"
          >
            <option value="stories">Most stories</option>
            <option value="bias-low">Lowest intent bias</option>
            <option value="predictability">Highest predictability</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/95">
        {/* Desktop header */}
        <div className="hidden grid-cols-[auto,1.6fr,1.3fr,1.3fr,1.4fr] gap-3 border-b border-slate-800 bg-slate-950 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
          <div className="text-left">#</div>
          <div className="text-left">Outlet</div>
          <div className="text-left">Stories</div>
          <div className="text-left">Avg Intent Bias</div>
          <div className="text-left">Predictability &amp; Range</div>
        </div>

        <div className="divide-y divide-slate-800">
          {items.map((item, idx) => {
            const intentLabel = scoreLabel(item.avg_bias_intent_score);
            const firstSeen = formatDateShort(item.first_seen_at);
            const lastSeen = formatDateShort(item.last_seen_at);
            const normalizedDifferent =
              item.outlet_normalized &&
              item.outlet_normalized.toLowerCase() !==
                item.outlet.toLowerCase();

            return (
              <div
                key={item.outlet + item.outlet_normalized}
                className="grid grid-cols-1 gap-3 px-4 py-3 text-sm text-slate-100 sm:grid-cols-[auto,1.6fr,1.3fr,1.3fr,1.4fr]"
              >
                {/* Rank */}
                <div className="flex items-center text-xs text-slate-400">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-slate-200">
                    {idx + 1}
                  </span>
                </div>

                {/* Outlet */}
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-50">
                    {item.outlet}
                  </div>
                  {normalizedDifferent && (
                    <div className="text-[11px] text-slate-500">
                      Canonical: {item.outlet_normalized}
                    </div>
                  )}
                  {(firstSeen || lastSeen) && (
                    <div className="text-[11px] text-slate-600">
                      {firstSeen && <span>Since {firstSeen}</span>}
                      {firstSeen && lastSeen && <span> · </span>}
                      {lastSeen && <span>Last seen {lastSeen}</span>}
                    </div>
                  )}
                </div>

                {/* Stories */}
                <div className="flex flex-col justify-center text-sm text-slate-100">
                  <span>{item.total_stories.toLocaleString()}</span>
                  <span className="text-[11px] text-slate-500">
                    scored stories
                  </span>
                </div>

                {/* Avg Intent Bias */}
                <div className="flex flex-col justify-center gap-1 text-sm">
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100">
                      {item.avg_bias_intent_score.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {intentLabel} intent
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Lower is more neutral in intent.
                  </div>
                </div>

                {/* Predictability & Range */}
                <div className="flex flex-col justify-center gap-1 text-sm">
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100">
                      PI {item.avg_pi_score.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bias range {item.min_bias_intent_score.toFixed(2)} –{" "}
                    {item.max_bias_intent_score.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
