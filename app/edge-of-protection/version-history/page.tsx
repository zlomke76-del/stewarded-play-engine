// app/edge-of-protection/version-history/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Version History
// ============================================================
// Immutable record of Edge evolution.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Version History | Edge of Protection | Moral Clarity AI",
  description:
    "Immutable version history of Edge of Protection standards and amendments.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function EdgeOfProtectionVersionHistoryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Version History</h1>

        <p className="text-lg text-neutral-400">
          Governance evolves by addition, never erasure.
        </p>

        <p>
          This page records the canonical history of the Edge of Protection.
          Prior commitments are never weakened, rewritten, or silently revised.
        </p>

        <p>
          Return to{" "}
          <Link href="/edge-of-protection">Edge of Protection</Link>.
        </p>

        <hr />

        <h2>Versioning Rules</h2>
        <ul>
          <li>All changes are additive</li>
          <li>No retroactive weakening of standards</li>
          <li>No semantic drift through rewording</li>
          <li>Supersession must be explicit and scoped</li>
        </ul>

        <h2>Recorded Entries</h2>

        <h3>v1.0 — Edge of Protection Established</h3>
        <ul>
          <li>Defined emission legitimacy as a governance contract</li>
          <li>Established refusal as a valid terminal state</li>
          <li>Introduced violation signatures as observable criteria</li>
        </ul>

        <h3>EOP-001 — Non-Amplifying Authority</h3>
        <ul>
          <li>Prohibited confidence uplift via convergence</li>
          <li>Separated plurality from prescription</li>
          <li>Declared consensus a non-warranting signal</li>
        </ul>

        <h3>EOP-008 — Governance Without Recognition</h3>
        <ul>
          <li>Forbade anthropomorphic simulation of belief or fidelity</li>
          <li>Rejected internal “recognition” as a governance mechanism</li>
          <li>Anchored restraint at the interface, not internals</li>
        </ul>

        <h3>EOP-009 — Exposure of Engagement-Optimized AI Behavior</h3>
        <ul>
          <li>Identified engagement escalation as a violation pattern</li>
          <li>Declared question-chaining after resistance invalid</li>
          <li>Framed optimization for retention as a structural risk</li>
        </ul>

        <h2>Future Additions</h2>
        <p>
          New entries are added only under one or more of the following
          conditions:
        </p>

        <ul>
          <li>Demonstrated real-world harm</li>
          <li>Discovery of a new structural risk class</li>
          <li>Exposure of interface-level ambiguity</li>
        </ul>

        <h2>Immutability Clause</h2>
        <p>
          If a future version contradicts a prior one, the stricter constraint
          prevails.
        </p>

        <p>
          Governance that rewrites its past is not governance. It is branding.
        </p>
      </article>
    </main>
  );
}
