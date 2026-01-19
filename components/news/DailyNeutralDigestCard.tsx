"use client";

import { useState, useMemo } from "react";

/* ========= TYPES ========= */

export type BiasScores = {
  bias_language_score: number;
  bias_framing_score: number;
  bias_source_score: number;
  bias_context_score: number;
  bias_intent_score: number;
  pi_score: number;
};

export type NewsDigestItem = BiasScores & {
  id: string;
  story_title: string;
  story_url: string;
  outlet: string;
  outlet_domain?: string;
  category?: string | null;
  published_at?: string | null;

  neutral_summary: string;
  key_facts: string[];

  context_background?: string | null;
  stakeholder_positions?: string[] | null;
  timeline?: string[] | null;
  disputed_claims?: string[] | null;
  omissions_detected?: string[] | null;
};

type DailyNeutralDigestCardProps = {
  item: NewsDigestItem;
};

/* ========= HELPERS ========= */

function scoreLabel(score: number): "Low" | "Medium" | "High" {
  if (score <= 0.33) return "Low";
  if (score <= 0.66) return "Medium";
  return "High";
}

/* ========= COMPONENT ========= */

export function DailyNeutralDigestCard({ item }: DailyNeutralDigestCardProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    story_title,
    story_url,
    outlet,
    outlet_domain,
    category,
    published_at,
    neutral_summary,
    key_facts,
    context_background,
    stakeholder_positions,
    timeline,
    disputed_claims,
    omissions_detected,
    bias_language_score,
    bias_framing_score,
    bias_source_score,
    bias_context_score,
    bias_intent_score,
    pi_score,
  } = item;

  const formattedDate = useMemo(() => {
    if (!published_at) return null;
    try {
      const d = new Date(published_at);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(d);
    } catch {
      return null;
    }
  }, [published_at]);

  const biasChips = [
    {
      label: "Language",
      score: bias_language_score,
    },
    {
      label: "Framing",
      score: bias_framing_score,
    },
    {
      label: "Source",
      score: bias_source_score,
    },
    {
      label: "Context",
      score: bias_context_score,
    },
  ];

  const hasDetails =
    !!context_background ||
    (stakeholder_positions && stakeholder_positions.length > 0) ||
    (timeline && timeline.length > 0) ||
    (disputed_claims && disputed_claims.length > 0) ||
    (omissions_detected && omissions_detected.length > 0);

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950/95 text-slate-50 shadow-lg shadow-slate-900/50">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-100">
              {outlet}
            </span>
            {category && (
              <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-200">
                {category}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5 text-right">
            {formattedDate && (
              <span className="text-[11px] font-medium text-slate-300">
                {formattedDate}
              </span>
            )}
            {outlet_domain && (
              <span className="text-[11px] text-slate-500">{outlet_domain}</span>
            )}
          </div>
        </div>

        <h2 className="text-base font-semibold leading-snug text-slate-50">
          <a
            href={story_url}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {story_title}
          </a>
        </h2>
      </div>

      {/* Body */}
      <div className="space-y-4 px-4 py-4">
        {/* Neutral Summary */}
        <section className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Neutral Summary
          </h3>
          <p className="text-sm leading-relaxed text-slate-100">
            {neutral_summary}
          </p>
        </section>

        {/* Key Facts */}
        {key_facts && key_facts.length > 0 && (
          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Key Facts
            </h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-slate-100">
              {key_facts.slice(0, 3).map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
              {key_facts.length > 3 && (
                <li className="text-xs text-slate-400">
                  + {key_facts.length - 3} more fact
                  {key_facts.length - 3 > 1 ? "s" : ""} in full analysis
                </li>
              )}
            </ul>
          </section>
        )}

        {/* Bias & Predictability Profile */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Bias &amp; Predictability Profile
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full bg-emerald-800/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-50">
              Intent: {bias_intent_score.toFixed(2)} ·{" "}
              {scoreLabel(bias_intent_score)}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-100">
              Predictability Index: {pi_score.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {biasChips.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-100"
              >
                <span className="font-medium text-slate-200">{b.label}</span>
                <span className="text-slate-400">
                  {b.score.toFixed(2)} · {scoreLabel(b.score)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Expandable Analysis Details */}
        {hasDetails && (
          <section className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between text-xs font-medium text-slate-200 hover:text-slate-50"
            >
              <span>
                {expanded
                  ? "Hide analysis details"
                  : "View analysis details from Solace"}
              </span>
              <span
                className={
                  "transition-transform " + (expanded ? "rotate-90" : "rotate-0")
                }
              >
                ▸
              </span>
            </button>

            {expanded && (
              <div className="mt-3 space-y-3 text-sm text-slate-100">
                {context_background && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Context &amp; Background
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-100">
                      {context_background}
                    </p>
                  </div>
                )}

                {stakeholder_positions &&
                  stakeholder_positions.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Stakeholder Positions
                      </h4>
                      <ul className="list-disc space-y-1 pl-4">
                        {stakeholder_positions.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {timeline && timeline.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Timeline
                    </h4>
                    <ul className="list-disc space-y-1 pl-4">
                      {timeline.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {disputed_claims && disputed_claims.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Disputed Claims
                    </h4>
                    <ul className="list-disc space-y-1 pl-4">
                      {disputed_claims.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {omissions_detected && omissions_detected.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Omissions Detected
                    </h4>
                    <ul className="list-disc space-y-1 pl-4">
                      {omissions_detected.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

