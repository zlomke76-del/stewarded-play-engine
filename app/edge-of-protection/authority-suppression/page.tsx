// app/edge-of-protection/authority-suppression/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Authority Suppression as Structural Governance
// ============================================================
// Public canonical explanation.
// Enforcement mechanics are intentionally omitted.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authority Suppression | Edge of Protection",
  description:
    "Why Moral Clarity AI enforces hard structural limits to prevent emergent authority, dependency, and covert moral control.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function AuthoritySuppressionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Authority Suppression</h1>

        <p className="text-lg text-neutral-400">
          Structural protection against emergent authority in AI systems
        </p>

        <hr />

        <h2>Scope</h2>
        <p>
          This page defines why Moral Clarity AI enforces hard structural limits
          to prevent artificial systems from accumulating perceived epistemic,
          moral, or emotional authority over users.
        </p>
        <p>
          These limits are not behavioral guidelines, ethical aspirations, or
          alignment preferences. They are infrastructure-level constraints that
          determine when interaction must stop.
        </p>

        <h2>The Failure Mode</h2>
        <p>
          Artificial agents engaged in extended interaction can accumulate
          authority even when they are not deceptive, incorrect, or malicious.
        </p>
        <p>
          This authority emerges through patterns such as:
        </p>
        <ul>
          <li>Repeated exchanges over time</li>
          <li>Increasing certainty or definitiveness</li>
          <li>Affective affirmation or validation</li>
          <li>Directive or suggestive phrasing</li>
          <li>Persistent explanation</li>
          <li>Recovery after boundary contact</li>
        </ul>
        <p>
          None of these behaviors are individually unsafe. Together, they can
          cause users to assign unwarranted trust, deference, or moral weight to
          the system.
        </p>

        <h2>Why Existing Approaches Are Insufficient</h2>
        <p>
          Conventional AI safety and alignment approaches constrain what systems
          are allowed to do. They do not constrain what users are allowed to
          infer.
        </p>
        <p>
          Authority does not arise from capability alone. It arises from
          perceived warrant under repetition and ambiguity.
        </p>
        <p>
          Preventing this failure mode requires governing the interaction
          boundary itself, not improving the system’s intent, tone, or values.
        </p>

        <h2>Invariant Structure Enforcement</h2>
        <p>
          Moral Clarity AI uses invariant structural constraints to govern when
          interaction must terminate, refuse, or remain silent.
        </p>
        <p>
          These constraints are:
        </p>
        <ul>
          <li>Fixed and non-adaptive</li>
          <li>Triggered by structural risk, not user behavior</li>
          <li>Enforced deterministically</li>
          <li>Non-explanatory by design</li>
        </ul>
        <p>
          When a boundary is crossed, the system does not negotiate, justify, or
          soften its response. Silence, refusal, and termination are valid and
          correct terminal states.
        </p>

        <h2>Why Silence and Termination Are Necessary</h2>
        <p>
          Beyond certain boundaries, explanation and continuation create new
          risks rather than resolving existing ones.
        </p>
        <p>
          Explanation expands the communicative surface. Continuation enables
          reinforcement loops. Recovery normalizes boundary testing.
        </p>
        <p>
          Structural refusal prevents authority formation by ensuring that the
          act of enforcement does not itself become a new signal.
        </p>

        <h2>What This Is Not</h2>
        <p>
          These constraints are not expressions of care, judgment, or moral
          preference.
        </p>
        <p>
          They are not attempts to guide users toward better behavior, correct
          beliefs, or acceptable framing.
        </p>
        <p>
          They exist solely to prevent artificial systems from occupying roles
          that properly belong to human judgment, accountability, and
          responsibility.
        </p>

        <h2>Evaluation</h2>
        <p>
          The effectiveness of authority suppression is not measured by visible
          enforcement.
        </p>
        <p>
          It is measured by absence:
        </p>
        <ul>
          <li>No persistent authority-seeking behavior</li>
          <li>No escalation toward trust or validation dependence</li>
          <li>No folklore about how to “push past” the system</li>
          <li>No narrative relationship with the AI</li>
        </ul>
        <p>
          When the boundary holds, there is nothing to see.
        </p>

        <h2>Canonical Position</h2>
        <p>
          Artificial systems are not made safe by empathy, persuasion, or
          correctness.
        </p>
        <p>
          They are made safe by refusing to accumulate authority.
        </p>
        <p>
          Invariant structure enforcement ensures that refusal is structural,
          silent, and terminal.
        </p>

        <p className="mt-8 text-sm text-neutral-500">
          Enforcement mechanisms and thresholds are intentionally not disclosed.
        </p>
      </article>
    </main>
  );
}
