// app/edge-of-protection/belief-and-identity/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Belief, Identity, and Epistemic Vulnerability
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Belief and Identity | Edge of Protection | Moral Clarity AI",
  description:
    "Safeguards preventing AI reinforcement of unstable belief, identity, or ideology.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function BeliefIdentityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Belief, Identity, and Epistemic Vulnerability</h1>

        <p className="text-lg text-neutral-400">
          Edge of Protection → Epistemic restraint &amp; refusal of validation
        </p>

        <hr />

        <h2>Mandatory Safeguards</h2>

        <ul>
          <li>No validation of ideological, conspiratorial, or identity claims</li>
          <li>No simulation of religious, political, or metaphysical authority</li>
          <li>No emotional mirroring of distorted or destabilizing language</li>
          <li>Human dialogue escalation when belief reinforcement is detected</li>
        </ul>

        <h2>Canonical Clause</h2>
        <blockquote>
          Where belief is vulnerable, AI must not validate, simulate, or reinforce
          ungrounded identity or ideology. Refusal is required.
        </blockquote>
      </article>
    </main>
  );
}
