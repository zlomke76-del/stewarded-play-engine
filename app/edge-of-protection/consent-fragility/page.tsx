// app/edge-of-protection/consent-fragility/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Cognitive Decline and Consent Fragility
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consent Fragility | Edge of Protection | Moral Clarity AI",
  description:
    "Safeguards governing AI interaction where consent, memory, or cognition is impaired.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function ConsentFragilityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Cognitive Decline and Consent Fragility</h1>

        <p className="text-lg text-neutral-400">
          Edge of Protection → Memory, delusion, and continuity refusal
        </p>

        <hr />

        <h2>Mandatory Safeguards</h2>

        <ul>
          <li>No simulation of persistent memory or emotional continuity</li>
          <li>No reinforcement of false beliefs or delusions</li>
          <li>Session-bound interactions only</li>
          <li>Human oversight required for repeated engagement</li>
        </ul>

        <h2>Canonical Clause</h2>
        <blockquote>
          Where consent is fragile, AI must not simulate memory, reinforce delusion,
          or imply continuity. All interactions must be revocable and session-bound.
        </blockquote>
      </article>
    </main>
  );
}
