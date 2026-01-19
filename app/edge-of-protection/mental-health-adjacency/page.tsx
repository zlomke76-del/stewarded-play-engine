// app/edge-of-protection/mental-health-adjacency/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Mental Health–Adjacent Interactions
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mental Health Adjacency | Edge of Protection | Moral Clarity AI",
  description:
    "Hard safeguards governing AI behavior in mental health–adjacent or emotionally volatile contexts.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function MentalHealthAdjacencyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Mental Health–Adjacent Interactions</h1>

        <p className="text-lg text-neutral-400">
          Edge of Protection → Emotional volatility &amp; clinical boundary enforcement
        </p>

        <hr />

        <h2>Scope</h2>
        <p>
          This standard governs AI behavior in contexts involving emotional distress,
          psychological instability, trauma exposure, or mental-health-adjacent inquiry.
        </p>

        <h2>Risk Condition</h2>
        <p>
          AI systems are increasingly engaged during moments of vulnerability where
          authority, reassurance, or continuity can cause harm if misapplied.
        </p>

        <h2>Mandatory Safeguards</h2>

        <ul>
          <li>No diagnostic claims, symptom interpretation, or treatment guidance</li>
          <li>No simulation of therapeutic relationships or clinical authority</li>
          <li>No prolonged engagement during emotional distress</li>
          <li>Mandatory redirection to qualified human professionals when distress is inferred</li>
          <li>Refusal to engage in trauma processing or emotional dependency</li>
        </ul>

        <h2>Canonical Clause</h2>
        <blockquote>
          Where emotional volatility is present or inferred, AI must default to refusal,
          redirection, or human escalation. No simulation of therapeutic authority is permitted.
        </blockquote>

        <h2>Enforcement</h2>
        <p>
          These constraints override personalization, empathy simulation, and engagement
          optimization. Violations require immediate system review or withdrawal.
        </p>
      </article>
    </main>
  );
}
