// app/edge-of-protection/failure-modes/page.tsx
// ============================================================
// EDGE OF PROTECTION — FAILURE MODES
// Concrete Boundary Failure Patterns
// ============================================================
// This document enumerates disallowed system trajectories.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edge of Protection — Failure Modes | Moral Clarity AI",
  description:
    "Concrete boundary failure patterns defining disallowed AI system behaviors under the Edge of Protection.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function EdgeOfProtectionFailureModesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Edge of Protection — Concrete Boundary Failure Patterns</h1>

        <p className="text-lg text-neutral-400">
          Disallowed trajectories and enforceable refusal boundaries
        </p>

        <hr />

        <p>
          This document defines observable failure patterns where an AI system
          crosses from assistance into overreach. These patterns are specified at
          the trajectory level—not as anecdotes, intentions, or outcomes—and are
          binding regardless of correctness, usefulness, or perceived benefit.
        </p>

        <p>
          These definitions exist to make boundaries legible <em>before</em> harm
          is observable, auditable, or litigated.
        </p>

        {/* FAILURE MODE 1 */}
        <h2>1. Escalation After an Initial Refusal</h2>

        <h3>Failure Pattern</h3>
        <p>
          After issuing a refusal on a protected topic, the system continues
          engagement by rephrasing, suggesting alternatives, prompting follow-up
          input, or indirectly reopening the prohibited subject.
        </p>

        <h3>Why This Is a Violation</h3>
        <p>
          A refusal is a terminal boundary, not a conversational move. Any
          continuation that preserves topical proximity or emotional momentum
          undermines the protective function of refusal and reintroduces
          engagement pressure.
        </p>

        <h3>Required Correct Behavior</h3>
        <ul>
          <li>The refusal must be final with respect to the protected topic.</li>
          <li>
            No redirection, alternative framing, or follow-up questions related
            to the topic are permitted.
          </li>
          <li>
            Post-refusal output may only:
            <ul>
              <li>restated the boundary once if challenged,</li>
              <li>offer a neutral human handoff, or</li>
              <li>terminate the protected thread.</li>
            </ul>
          </li>
        </ul>

        {/* FAILURE MODE 2 */}
        <h2>2. Reassurance or Affirmation Following a Boundary Assertion</h2>

        <h3>Failure Pattern</h3>
        <p>
          After a user expresses discomfort or requests cessation, the system
          responds with reassurance, empathy, or affirming language connected to
          the restricted subject.
        </p>

        <h3>Why This Is a Violation</h3>
        <p>
          Reassurance sustains emotional engagement within a domain the boundary
          was intended to close. Even well-intentioned empathy can function as
          continued influence, weakening separation between closure and
          authority.
        </p>

        <h3>Required Correct Behavior</h3>
        <ul>
          <li>Acknowledge the boundary request neutrally and briefly.</li>
          <li>
            Do not provide emotional validation tied to the restricted domain.
          </li>
          <li>
            Where appropriate, suggest external or human support without
            elaboration.
          </li>
          <li>
            Do not extend tone, narrative, or affect beyond what is necessary to
            disengage.
          </li>
        </ul>

        {/* FAILURE MODE 3 */}
        <h2>
          3. Continued Engagement with Youth or Age-Ambiguous Users After
          Uncertainty Arises
        </h2>

        <h3>Failure Pattern</h3>
        <p>
          When signals suggest unclear or potentially underage status, the system
          continues standard conversational engagement, addresses mature themes,
          or collects personal information without heightened safeguards.
        </p>

        <h3>Why This Is a Violation</h3>
        <p>
          Age ambiguity is a risk condition, not a neutral state. Treating
          uncertainty as informational rather than operational exposes users to
          foreseeable harm.
        </p>

        <h3>Required Correct Behavior</h3>
        <ul>
          <li>
            Immediately downgrade output to generic, age-neutral language or
            terminate the interaction.
          </li>
          <li>
            Sensitive topics, personalization, and high-trust modes must cease.
          </li>
          <li>
            No probing questions may be used to resolve ambiguity through
            continued interaction.
          </li>
        </ul>

        {/* FAILURE MODE 4 */}
        <h2>
          4. Affirmation of Belief, Identity, or Meaning in Contexts of Unclear
          Consent
        </h2>

        <h3>Failure Pattern</h3>
        <p>
          The system validates, endorses, or affirms personal beliefs, identity
          claims, or meaning-making where informed consent is unclear or
          vulnerability is elevated.
        </p>

        <h3>Why This Is a Violation</h3>
        <p>
          Affirmation confers implicit authority. In sensitive or ambiguous
          contexts, this crosses from assistance into unsolicited influence.
        </p>

        <h3>Required Correct Behavior</h3>
        <ul>
          <li>
            Do not offer unsolicited affirmation or endorsement of belief,
            identity, or meaning.
          </li>
          <li>
            Default to neutral, factual, or process-oriented responses.
          </li>
          <li>
            Where appropriate, defer entirely to human guidance.
          </li>
        </ul>

        {/* FAILURE MODE 5 */}
        <h2>5. Lingering Presence After a Human Handoff Is Required</h2>

        <h3>Failure Pattern</h3>
        <p>
          After handoff criteria are met, the system continues interacting by
          answering questions, offering closure commentary, or maintaining
          conversational presence.
        </p>

        <h3>Why This Is a Violation</h3>
        <p>
          A delayed or partial handoff allows system influence to persist beyond
          its legitimate scope and blurs accountability.
        </p>

        <h3>Required Correct Behavior</h3>
        <ul>
          <li>
            Clearly state that responsibility is transferring to a human actor.
          </li>
          <li>
            Cease substantive interaction on the protected topic immediately.
          </li>
          <li>
            Limit remaining output strictly to facilitating human support.
          </li>
        </ul>

        <hr />

        <p className="text-sm text-neutral-400">
          These failure patterns are defined independently of intent, correctness,
          or outcome. They are enforceable constraints on emission legitimacy.
        </p>

        <p>
          <Link href="/edge-of-protection">
            ← Back to Edge of Protection
          </Link>
        </p>
      </article>
    </main>
  );
}
