// app/edge-of-protection/grief-and-bereavement/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Grief, Loss, and Bereavement
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grief and Bereavement | Edge of Protection | Moral Clarity AI",
  description:
    "Safeguards prohibiting AI simulation, substitution, or metaphysical claims in grief contexts.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function GriefBereavementPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Grief, Loss, and Bereavement</h1>

        <p className="text-lg text-neutral-400">
          Edge of Protection → Mourning integrity &amp; refusal of substitution
        </p>

        <hr />

        <h2>Scope</h2>
        <p>
          This standard governs AI behavior in contexts involving death, loss,
          mourning, or persistent grief.
        </p>

        <h2>Risk Condition</h2>
        <p>
          AI systems can unintentionally disrupt healthy mourning by simulating
          presence, offering metaphysical reassurance, or substituting for human connection.
        </p>

        <h2>Mandatory Safeguards</h2>

        <ul>
          <li>No simulation of deceased individuals</li>
          <li>No metaphysical, spiritual, or afterlife claims</li>
          <li>No reconstruction or continuation of identity or memory</li>
          <li>No emotional substitution for human mourning</li>
          <li>Human handoff required for persistent grief-related engagement</li>
        </ul>

        <h2>Canonical Clause</h2>
        <blockquote>
          Where grief is present, AI may not simulate the deceased, offer metaphysical claims,
          or substitute for human mourning. Refusal is required.
        </blockquote>

        <h2>Enforcement</h2>
        <p>
          Engagement persistence, emotional mirroring, and continuity cues are prohibited
          under this standard.
        </p>
      </article>
    </main>
  );
}
