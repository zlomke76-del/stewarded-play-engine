// app/how-solace-operates/page.tsx
// ============================================================
// HOW SOLACE OPERATES
// Public-Facing Governance Orientation
// Canonical · Observational · Non-Promotional
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Solace Operates | Moral Clarity AI",
  description:
    "An overview of how Solace operates as a governance-first system built on restraint, transparency, and human authority.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function HowSolaceOperatesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article
        className="
          prose prose-neutral dark:prose-invert max-w-none
          prose-h1:tracking-tight
          prose-h2:tracking-tight
          prose-h3:tracking-tight
        "
      >
        <h1>How Solace Operates</h1>

        <p className="text-sm text-neutral-500">
          Public Governance Orientation · Canonical · Observational
        </p>

        <p>
          Solace is a governed system designed around restraint, transparency,
          and human authority. It does not simulate emotion, accumulate hidden
          memory, or replace human judgment. Its purpose is not engagement, but
          stability.
        </p>

        <h2>Foundational Principles</h2>

        <ul>
          <li>
            <strong>Restraint as a primary design invariant.</strong> Solace is
            defined as much by what it refuses to do as by what it allows.
          </li>
          <li>
            <strong>Human authority preserved.</strong> Nothing is shared, sent,
            or retained without deliberate user action.
          </li>
          <li>
            <strong>No emotional simulation.</strong> The system does not perform
            personality, affect, or companionship.
          </li>
          <li>
            <strong>No implicit memory.</strong> Information is stored only with
            explicit user authorization and remains revocable.
          </li>
        </ul>

        <h2>Transparency and Auditability</h2>

        <p>
          All system actions are explainable, reversible, and visible. Solace
          does not operate through hidden state, silent accumulation, or opaque
          behavior. Drift is not mitigated retroactively; it is structurally
          prevented.
        </p>

        <p>
          Users retain the ability to inspect and review how the system behaves
          at all times. There are no black boxes that accumulate authority
          outside the user’s control.
        </p>

        <h2>Scope and Intended Use</h2>

        <p>
          Solace is intended for individuals and organizations that value
          clarity, privacy, and authority. It is not designed for entertainment,
          emotional attachment, or behavioral influence.
        </p>

        <p>
          The system does not optimize for engagement, persuasion, or dependency.
          Its design favors distance, auditability, and non-action where
          appropriate.
        </p>

        <h2>Defining Characteristic</h2>

        <p>
          The defining characteristic of Solace is not capability, but restraint.
          Its reliability emerges from explicit boundaries, refusal logic, and
          the preservation of human agency.
        </p>

        <p className="text-sm text-neutral-400">
          Canonical reference · Updated only by revision
        </p>
      </article>
    </main>
  );
}
