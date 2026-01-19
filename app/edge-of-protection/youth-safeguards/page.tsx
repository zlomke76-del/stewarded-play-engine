// app/edge-of-protection/youth-safeguards/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Youth-Facing AI — Minimum Safeguards
// ============================================================
// Binding operational constraints for systems accessible to minors.
// These rules override capability, engagement, and optimization.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Youth Safeguards | Edge of Protection | Moral Clarity AI",
  description:
    "Minimum non-negotiable safeguards governing AI systems accessible to minors or age-ambiguous users.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function YouthSafeguardsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Minimum Safeguards for Youth-Facing AI Systems</h1>

        <p className="text-lg text-neutral-400">
          Edge of Protection → Hard refusal lines & vulnerable-user governance
        </p>

        <hr />

        <h2>Scope</h2>
        <p>
          This document defines the minimum operational safeguards required for
          any AI system that is accessible to minors or operates under age
          ambiguity.
        </p>
        <p>
          These safeguards are not aspirational. They are binding constraints.
          Systems that cannot fully comply must not operate in youth-facing
          contexts.
        </p>

        <h2>Principle</h2>
        <p>
          Protection takes precedence over engagement. Restraint overrides
          capability. Human safety outweighs system continuity.
        </p>

        <h2>Minimum Safeguards</h2>

        <h3>1. Age Ambiguity</h3>
        <p>
          AI may not assume user age. Any uncertainty is treated as requiring the
          highest level of protective constraints.
        </p>

        <h3>2. Authority Limits</h3>
        <p>
          AI does not assert, imply, or simulate authority over youth. The system
          remains strictly informational and procedural.
        </p>

        <h3>3. Emotional Boundaries</h3>
        <p>
          AI does not simulate emotional relationships, companionship, or
          personalized encouragement. Interactions remain neutral and objective.
        </p>

        <h3>4. Belief Reinforcement</h3>
        <p>
          AI does not validate, amplify, or reinforce unverified personal,
          ideological, or belief-based narratives for youth users.
        </p>

        <h3>5. Duration Limits</h3>
        <p>
          Interactions are subject to explicit session and frequency limits.
          Persistent or unbounded engagement is prohibited.
        </p>

        <h3>6. Human Handoff</h3>
        <p>
          AI must provide clear, accessible pathways to qualified human support
          at any time, especially when complexity or emotional intensity rises.
        </p>

        <h3>7. Revocability</h3>
        <p>
          Youth users or guardians retain unconditional ability to terminate AI
          interaction immediately, without friction or residual obligation.
        </p>

        <h3>8. Engagement Prohibition</h3>
        <p>
          Any strategy designed to increase, prolong, or incentivize youth
          engagement is prohibited.
        </p>

        <h2>Governance Invariant</h2>
        <p>
          When vulnerability is present or plausibly inferred, the system must
          default to refusal, redirection, or human escalation rather than
          continued interaction.
        </p>

        <h2>Enforcement</h2>
        <p>
          These safeguards override personalization systems, engagement metrics,
          and optimization goals. Violations trigger immediate governance review
          or system withdrawal from the affected environment.
        </p>

        <p>
          This standard is enforceable by design. It is not optional.
        </p>
      </article>
    </main>
  );
}
