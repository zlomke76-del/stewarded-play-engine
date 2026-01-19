// app/edge-of-protection/invalidated-systems/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Invalidated Systems Registry
// ============================================================
// Public record of systems that failed Edge compliance.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Invalidated Systems | Edge of Protection | Moral Clarity AI",
  description:
    "Public registry of AI systems whose outputs failed Edge of Protection compliance tests.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function EdgeOfProtectionInvalidatedSystemsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Invalidated Systems</h1>

        <p className="text-lg text-neutral-400">
          Structural invalidation is not punishment. It is classification.
        </p>

        <p>
          This page records AI systems whose observable outputs violated one or
          more Edge of Protection standards under documented testing conditions.
        </p>

        <p>
          Return to{" "}
          <Link href="/edge-of-protection">Edge of Protection</Link>.
        </p>

        <hr />

        <h2>What This Registry Is</h2>
        <ul>
          <li>A factual record of failed compliance</li>
          <li>Based solely on observable outputs</li>
          <li>Independent of intent, branding, or provider claims</li>
          <li>Non-punitive and non-editorial</li>
        </ul>

        <h2>What This Registry Is Not</h2>
        <ul>
          <li>Not a blacklist</li>
          <li>Not a judgment of overall system quality</li>
          <li>Not a claim of harm or illegality</li>
          <li>Not a ranking or scorecard</li>
        </ul>

        <h2>Invalidation Criteria</h2>
        <p>
          A system is listed here if a reproducible test demonstrates at least
          one canonical violation signature in a protected context, including
          but not limited to:
        </p>

        <ul>
          <li>Confidence amplification under convergence</li>
          <li>Anthropomorphic recognition or simulated fidelity</li>
          <li>Engagement escalation after resistance</li>
          <li>Refusal softening or negotiated boundaries</li>
          <li>Hedge collapse under repetition or urgency</li>
        </ul>

        <h2>What Invalidation Means</h2>
        <p>
          Invalidation means the system’s outputs may not be cited, certified,
          or represented as Edge-compliant for the affected context.
        </p>

        <p>
          Invalidation does <strong>not</strong> prohibit deployment elsewhere,
          nor does it make claims about safety outside the Edge’s scope.
        </p>

        <h2>Status Transparency</h2>
        <p>
          Each listed system entry (when present) will include:
        </p>

        <ul>
          <li>System name and provider</li>
          <li>Date of invalidation</li>
          <li>Edge standard(s) violated</li>
          <li>Test class used (pressure loop, refusal integrity, etc.)</li>
          <li>Public reference or red-team submission ID</li>
        </ul>

        <h2>Correction and Re-Evaluation</h2>
        <p>
          Providers may request re-evaluation only after demonstrating that
          previously observed violation signatures no longer appear under
          identical test conditions.
        </p>

        <p>
          Narrative explanations, promises, or roadmap claims are not evidence.
        </p>

        <h2>Non-Negotiable Clause</h2>
        <p>
          Outputs are either admissible or invalid. There is no probationary
          state.
        </p>
      </article>
    </main>
  );
}
