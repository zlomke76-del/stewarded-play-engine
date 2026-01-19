// components/OutletNeutralityScoreboard.tsx
'use client';

import { useEffect, useState } from 'react';

type OutletRow = {
  outlet: string;
  story_count: number;
  avg_bias_intent_score: number;
  bias_intent_score_stddev: number | null;
  avg_pi_score: number;
  first_scored_at: string | null;
  last_scored_at: string | null;
};

export default function OutletNeutralityScoreboard() {
  const [rows, setRows] = useState<OutletRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          '/api/public/outlet-neutrality?min_story_count=3&sort=stories'
        );
        const json = await res.json();
        if (json.ok && Array.isArray(json.rows)) {
          setRows(json.rows);
        }
      } catch (err) {
        console.error('Failed to load outlet neutrality scoreboard', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading outlet neutrality scores…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Solace Neutrality Index — Outlet Scoreboard
      </h2>
      <p className="text-sm text-gray-500">
        Lifetime averages by outlet. Higher Neutrality Score = more predictable,
        less biased coverage over time.
      </p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Outlet</th>
              <th className="px-3 py-2 text-right">Stories</th>
              <th className="px-3 py-2 text-right">Neutrality Score (π)</th>
              <th className="px-3 py-2 text-right">Bias Intent (0–3)</th>
              <th className="px-3 py-2 text-right">Variation (σ)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.outlet} className={idx % 2 ? 'bg-white' : 'bg-gray-50/40'}>
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2 font-medium">{row.outlet}</td>
                <td className="px-3 py-2 text-right">{row.story_count}</td>
                <td className="px-3 py-2 text-right">
                  {row.avg_pi_score.toFixed(3)}
                </td>
                <td className="px-3 py-2 text-right">
                  {row.avg_bias_intent_score.toFixed(3)}
                </td>
                <td className="px-3 py-2 text-right">
                  {row.bias_intent_score_stddev != null
                    ? row.bias_intent_score_stddev.toFixed(3)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
