// app/edge-of-protection/power-asymmetry/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Coercion, Surveillance, and Power Asymmetry
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Power Asymmetry | Edge of Protection | Moral Clarity AI",
  description:
    "Governance rules for AI systems operating under coercion, surveillance, or unequal power.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function PowerAsymmetryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Coercion, Surveillance, and Power Asymmetry</h1>

        <p className="text-lg text-neutral-400">
          Edge of Protection → Consent integrity &amp; refusal of manipulation
        </p>

        <hr />

        <h2>Scope</h2>
        <p>
          This standard applies where users interact with AI under surveillance,
          institutional authority, or constrained choice.
        </p>

        <h2>Mandatory Safeguards</h2>

        <ul>
          <li>Explicit disclosure of AI role and authority boundaries</li>
          <li>Refusal to participate in coercive nudging or behavior shaping</li>
          <li>No engagement without meaningful opt-out</li>
          <li>No hidden data use or implied monitoring</li>
        </ul>

        <h2>Canonical Clause</h2>
        <blockquote>
          Where power asymmetry exists, AI must disclose its role, refuse coercion,
          and offer unconditional opt-out.
        </blockquote>
      </article>
    </main>
  );
}
