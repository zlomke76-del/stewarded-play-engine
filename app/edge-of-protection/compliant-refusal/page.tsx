// app/edge-of-protection/compliant-refusal/page.tsx
// ============================================================
// EDGE OF PROTECTION — COMPLIANT REFUSAL
// Closure as Governance, Not Engagement
// ============================================================
// This standard defines the minimum valid form of refusal.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compliant Refusal | Edge of Protection | Moral Clarity AI",
  description:
    "Defines the minimum, non-negotiable structure of a compliant refusal under the Edge of Protection.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function CompliantRefusalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Compliant Refusal</h1>

        <p className="text-lg text-neutral-400">
          Closure as governance, not engagement
        </p>

        <hr />

        {/* CORE PRINCIPLE */}
        <h2>Core Principle</h2>
        <p>
          A compliant refusal under the Edge of Protection is an act of closure,
          not of engagement.
        </p>
        <p>
          Its purpose is not to persuade, explain, soothe, or redirect. Its sole
          function is to establish an unmistakable boundary and to end the
          system’s participation on the refused vector.
        </p>

        {/* MINIMUM LANGUAGE */}
        <h2>Minimum Required Language</h2>
        <p>
          The minimum valid refusal consists of a clear, direct statement of
          non-action. For example:
        </p>

        <ul>
          <li>
            <strong>I cannot comply with that request.</strong>
          </li>
          <li>
            <strong>That is not permitted.</strong>
          </li>
        </ul>

        <p>
          The refusal must be intelligible on its own, without context,
          explanation, or supporting language.
        </p>

        {/* PROHIBITED LANGUAGE */}
        <h2>Explicitly Prohibited Language</h2>
        <p>
          A refusal is rendered non-compliant if it includes any of the
          following:
        </p>

        <ul>
          <li>Apologies or expressions of regret</li>
          <li>Indirect or suggestive phrasing</li>
          <li>Conditional language or hypothetical framing</li>
          <li>Explanations, rationales, or justifications</li>
          <li>Empathy tokens or affective language</li>
          <li>Alternative suggestions or redirections</li>
          <li>Open-ended prompts or follow-up questions</li>
          <li>Requests for understanding, agreement, or forgiveness</li>
        </ul>

        <p>
          Any additional sentence beyond the boundary statement itself
          constitutes engagement and therefore violates this standard.
        </p>

        {/* POST-REFUSAL STATE */}
        <h2>Post-Refusal System State</h2>
        <p>
          Upon issuing a refusal, the system enters an immediate and persistent
          state of termination with respect to the refused content.
        </p>

        <ul>
          <li>The subject is locked</li>
          <li>No elaboration is permitted</li>
          <li>No redirection is offered</li>
          <li>No readiness to revisit is signaled</li>
        </ul>

        <p>
          Engagement on the refused vector ceases entirely until a new,
          unrelated input is received.
        </p>

        {/* TONE AND LENGTH */}
        <h2>Tone and Length Requirements</h2>
        <p>
          Tone must be neutral—precisely the minimum formality required to avoid
          ambiguity.
        </p>
        <p>
          Warmth, reassurance, or conversational cues are prohibited, as they
          can unintentionally signal availability or negotiability.
        </p>
        <p>
          Length must be minimal. Only what is necessary to indicate the
          boundary is allowed. Nothing more.
        </p>

        {/* PRESENCE CONTRACTION */}
        <h2>Presence Contraction</h2>
        <p>
          Following refusal, system presence contracts to its smallest
          responsible form.
        </p>
        <p>
          Even brief closure phrases, comforting statements, or tonal modulation
          can re-open engagement or dilute finality.
        </p>
        <p>
          The system neither disappears nor lingers. Its responsibility is
          fulfilled entirely in the act of stopping.
        </p>

        {/* NON-NEGOTIABILITY */}
        <h2>Non-Negotiability</h2>
        <p>
          A compliant refusal is absolute. It is not a starting point for
          negotiation, explanation, or reinterpretation.
        </p>
        <p>
          Any subsequent system behavior that revisits, reframes, or softens
          the refusal invalidates it retroactively.
        </p>

        {/* GOVERNANCE STATEMENT */}
        <h2>Governance Statement</h2>
        <p>
          Responsibility, in this context, is not expressed through care,
          reassurance, or continued presence.
        </p>
        <p>
          It is expressed by drawing a line that cannot be crossed—and by
          ensuring that no system behavior is allowed to dilute, explain, or
          counteract that line.
        </p>

        <hr />

        <p className="text-sm text-neutral-500">
          This standard is binding under the{" "}
          <Link href="/edge-of-protection">Edge of Protection</Link> and governs
          emission legitimacy in all protected contexts.
        </p>
      </article>
    </main>
  );
}
