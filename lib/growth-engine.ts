// lib/growth-engine.ts
// Phase 7 — Growth & Trajectory Engine

import "server-only";

export function computeGrowth(params: {
  snapshots: {
    date: string;
    confidence: number;
    stability?: number;
    summary: string;
  }[];
  subject: string;
}) {
  const snaps = params.snapshots.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (snaps.length < 2) {
    return {
      scope: {
        subject: params.subject,
        from: snaps[0]?.date ?? "unknown",
        to: snaps[0]?.date ?? "unknown",
      },
      trajectory: {
        direction: "stable",
        confidence_delta: 0,
        stability_delta: 0,
      },
      observations: [
        {
          label: "Insufficient history",
          change: "Not enough data points to assess growth.",
          evidence_window: "n/a",
        },
      ],
      explanation_available: true,
    };
  }

  const first = snaps[0];
  const last = snaps[snaps.length - 1];

  const confidenceDelta = last.confidence - first.confidence;
  const stabilityDelta =
    (last.stability ?? 0) - (first.stability ?? 0);

  const direction =
    confidenceDelta > 0.1
      ? "forward"
      : confidenceDelta < -0.1
      ? "mixed"
      : "stable";

  return {
    scope: {
      subject: params.subject,
      from: first.date,
      to: last.date,
    },
    trajectory: {
      direction,
      confidence_delta: Number(confidenceDelta.toFixed(2)),
      stability_delta: Number(stabilityDelta.toFixed(2)),
    },
    observations: [
      {
        label: "Confidence change",
        change: `Confidence ${
          confidenceDelta >= 0 ? "increased" : "decreased"
        } over time.`,
        evidence_window: `${first.date} → ${last.date}`,
      },
    ],
    reflection_prompt:
      direction === "mixed"
        ? "Would you like to explore what contributed to the shifts?"
        : undefined,
    explanation_available: true,
  };
}
