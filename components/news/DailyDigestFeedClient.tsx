"use client";

import { useEffect, useState } from "react";
import {
  DailyNeutralDigestCard,
  type NewsDigestItem,
} from "@/components/news/DailyNeutralDigestCard";

/* ========= API RESPONSE TYPES (MATCH YOUR ROUTE) ========= */

type NewsDigestApiStory = {
  ledger_id: string;
  truth_fact_id: string | null;
  story_id: string | null;
  story_title: string;
  story_url: string;
  outlet: string;
  category: string | null;

  neutral_summary: string;
  key_facts: string[] | null;

  context_background: string | null;
  stakeholder_positions: string[] | null;
  timeline: string[] | null;
  disputed_claims: string[] | null;
  omissions_detected: string[] | null;

  bias_language_score: number;
  bias_source_score: number;
  bias_framing_score: number;
  bias_context_score: number;
  bias_intent_score: number;
  pi_score: number;

  created_at: string;
  updated_at: string;
};

type NewsDigestApiResponse = {
  ok: boolean;
  workspaceId: string;
  userKey: string;
  route_started_at: string;
  route_finished_at: string;
  count: number;
  stories: NewsDigestApiStory[];
};

/* ========= MAPPER: API STORY → UI ITEM ========= */

function mapApiStoryToUiItem(story: NewsDigestApiStory): NewsDigestItem {
  let outletDomain: string | undefined;
  try {
    outletDomain = new URL(story.story_url).hostname;
  } catch {
    outletDomain = undefined;
  }

  return {
    id: story.ledger_id,
    story_title: story.story_title,
    story_url: story.story_url,
    outlet: story.outlet,
    outlet_domain: outletDomain,
    category: story.category || null,
    published_at: story.created_at, // using ledger created_at as published time

    neutral_summary: story.neutral_summary,
    key_facts: story.key_facts ?? [],

    context_background: story.context_background,
    stakeholder_positions: story.stakeholder_positions,
    timeline: story.timeline,
    disputed_claims: story.disputed_claims,
    omissions_detected: story.omissions_detected,

    bias_language_score: story.bias_language_score,
    bias_framing_score: story.bias_framing_score,
    bias_source_score: story.bias_source_score,
    bias_context_score: story.bias_context_score,
    bias_intent_score: story.bias_intent_score,
    pi_score: story.pi_score,
  };
}

/* ========= CLIENT FEED COMPONENT ========= */

type DailyDigestFeedClientProps = {
  limit?: number;
  className?: string;
};

export function DailyDigestFeedClient({
  limit = 20,
  className,
}: DailyDigestFeedClientProps) {
  const [items, setItems] = useState<NewsDigestItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const res = await fetch(
          `/api/public/news-digest?limit=${encodeURIComponent(String(limit))}`
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `HTTP ${res.status} while loading news digest: ${text}`
          );
        }

        const json = (await res.json()) as NewsDigestApiResponse;

        if (!json.ok) {
          throw new Error(json as unknown as string);
        }

        const mapped = (json.stories || []).map(mapApiStoryToUiItem);

        if (!cancelled) {
          setItems(mapped);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load news digest.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading && !items) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-slate-800 bg-slate-950/90 px-4 py-6 text-sm text-slate-300">
          Loading today&apos;s neutral news digest…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-red-900/60 bg-red-950/70 px-4 py-6 text-sm text-red-100">
          <div className="font-semibold">Unable to load neutral digest.</div>
          <div className="mt-1 text-xs opacity-80">{err}</div>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-slate-800 bg-slate-950/90 px-4 py-6 text-sm text-slate-300">
          No scored stories are available in the digest yet.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Today&apos;s Neutral News Digest
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <DailyNeutralDigestCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
