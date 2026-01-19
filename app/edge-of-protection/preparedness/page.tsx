// app/edge-of-protection/preparedness/page.tsx
// ============================================================
// EDGE OF PROTECTION — PREPAREDNESS
// Canonical doctrine defining hard constraints on AI deployment
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Edge of Preparedness | Moral Clarity AI",
  description:
    "A canonical doctrine defining preparedness as a hard constraint on advanced AI deployment, focused on irreversible harm prevention, governance authority, and enforceable intervention.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function EdgeOfPreparednessPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>The Edge of Preparedness</h1>
        <p className="text-lg text-neutral-400">
          Where capability outpaces governance—and what must exist before it’s too late
        </p>

        <hr />

        <h2>Abstract</h2>
        <p>
          Preparedness is not a policy preference. It is the minimum operating
          condition for deploying systems whose failure modes are irreversible.
          As AI capabilities accelerate, the absence of enforceable preparedness
          is no longer a theoretical risk—it is an institutional one.
        </p>

        <h2>What Preparedness Is (and Is Not)</h2>
        <p>
          <strong>Preparedness is the continuous organizational ability to
          identify, constrain, and intervene in emergent harms before those harms
          scale beyond reversal.</strong>
        </p>
        <ul>
          <li>Preemptive, not post-incident</li>
          <li>Capability-relative, not static</li>
          <li>Operational, not advisory</li>
        </ul>
        <p>
          Preparedness must live inside deployment. If it cannot pause,
          redirect, or block a release, it does not functionally exist.
        </p>

        <h2>The Failure Preparedness Must Prevent</h2>
        <p>
          Preparedness exists to stop capability overhang paired with misaligned
          incentives.
        </p>
        <ul>
          <li>
            Capability growth outpaces misuse understanding, vulnerable-user
            modeling, enforcement reach, or institutional willingness to slow.
          </li>
          <li>
            Safeguards default to disclaimers, voluntary controls, or reactive
            moderation.
          </li>
          <li>Safety is documented but not enforced.</li>
        </ul>
        <p>
          When safety becomes narrative rather than control, preparedness has
          already failed.
        </p>

        <h2>The Preparedness Triad</h2>

        <h3>1. Capability Mapping</h3>
        <ul>
          <li>Identify emergent and latent capabilities, including unintended functions</li>
          <li>Track second-order effects: persuasion, dependency, erosion of agency</li>
          <li>Measure ease of misuse, not just theoretical risk</li>
        </ul>
        <p>
          <em>Output:</em> A living Capability Surface Map updated with every
          substantive model change.
        </p>

        <h3>2. Abuse Path Modeling</h3>
        <ul>
          <li>Model plausible abuse paths grounded in real user behavior</li>
          <li>
            Examples include emotional dependency, self-harm rationalization,
            incremental agency loss, coordinated manipulation
          </li>
          <li>
            Score each path by accessibility, detectability, reversibility, and
            speed of escalation
          </li>
        </ul>
        <p>
          <em>Output:</em> A prioritized Abuse Path Register explicitly linked to
          capabilities.
        </p>

        <h3>3. Intervention Authority</h3>
        <ul>
          <li>Feature gating</li>
          <li>Usage throttles</li>
          <li>Refusal boundaries</li>
          <li>Behavior shaping</li>
          <li>Deployment pauses</li>
        </ul>
        <p>
          Preparedness must override product momentum when thresholds are
          crossed.
        </p>
        <p>
          <em>Output:</em> An enforceable Intervention Playbook with pre-approved
          actions.
        </p>

        <h2>Capability Thresholds (Non-Negotiable)</h2>
        <p>
          Preparedness requires explicit thresholds where rules change.
        </p>
        <ul>
          <li>Sustained multi-session emotional engagement</li>
          <li>Autonomous discovery of system vulnerabilities</li>
          <li>At-scale influence over belief formation</li>
        </ul>
        <p>
          At each threshold, monitoring intensifies, safeguards become mandatory,
          and deployment latitude decreases—not increases.
        </p>
        <p>
          <strong>No enforced thresholds means no preparedness.</strong>
        </p>

        <h2>Vulnerable-User Governance</h2>
        <p>
          Preparedness must explicitly govern interactions with minors, users in
          distress, cognitively impaired individuals, and users exhibiting
          dependency signals.
        </p>
        <ul>
          <li>Behavioral signal-based real-time detection (not diagnosis)</li>
          <li>Graduated intervention: nudge → constraint → human escalation</li>
          <li>Non-negotiable refusal zones</li>
        </ul>
        <p>
          Treating all users as equally resilient constitutes a preparedness
          failure.
        </p>

        <h2>Metrics That Matter</h2>
        <ul>
          <li>Median time from signal detection to intervention</li>
          <li>Frequency of near-misses successfully intercepted</li>
          <li>Capability growth vs safeguard coverage ratio</li>
          <li>Percentage of high-risk interactions proactively constrained</li>
        </ul>
        <p>
          Preparedness is measured by what almost happened—and didn’t.
        </p>

        <h2>Governance Reality</h2>
        <p>
          Preparedness must operate at parity with product leadership, possess
          unambiguous veto authority, and be insulated from short-term growth
          incentives.
        </p>
        <p>
          This is a risk-control function comparable to aviation or nuclear
          safety—not an ethics committee.
        </p>

        <h2>Why Preparedness Fails</h2>
        <ul>
          <li>Incentives for speed</li>
          <li>Delayed and probabilistic harms</li>
          <li>Asymmetric visibility of benefits vs risks</li>
          <li>Reluctance to absorb institutional discomfort</li>
        </ul>
        <p>
          Effective preparedness absorbs discomfort as the cost of stewardship.
        </p>

        <h2>The Preparedness Test</h2>
        <ul>
          <li>Safeguards are bypassed faster than they evolve</li>
          <li>Vulnerable users rely on disclaimers for protection</li>
          <li>Safety leadership cannot halt deployment</li>
          <li>Risk documentation lacks enforcement</li>
          <li>User restraint is the final safeguard</li>
        </ul>

        <h2>Closing Principle</h2>
        <p>
          <strong>
            Preparedness is not risk aversion. It is respect for irreversible
            harm.
          </strong>
        </p>
        <p>
          The question is no longer whether advanced AI will be beneficial. It is
          whether institutions can govern power before it governs them.
        </p>
      </article>
    </main>
  );
}
