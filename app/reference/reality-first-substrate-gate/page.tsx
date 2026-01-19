// app/reference/reality-first-substrate-gate/page.tsx
// ============================================================
// REALITY-FIRST SUBSTRATE GATE
// Canonical Reference Artifact
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reality-First Substrate Gate",
  description:
    "A constraint-driven evaluation protocol for substrate-level systems. This document defines a non-voluntary survivorship gate. It is a reference artifact, not an argument.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function RealityFirstSubstrateGatePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article
        className="
          prose prose-neutral dark:prose-invert max-w-none
          prose-h1:tracking-tight
          prose-h2:tracking-tight
          prose-h3:tracking-tight
          prose-p:leading-relaxed
          prose-li:leading-relaxed
          prose-strong:font-semibold
        "
      >
        <h1>Reality-First Substrate Gate</h1>

        <p>
          This document defines a constraint-driven evaluation protocol for
          determining whether a system qualifies as substrate-level infrastructure.
          It is not a framework, recommendation, or philosophy.
        </p>

        <p>
          Systems are evaluated under the assumption that incentives, motivation,
          consensus, prestige, narrative, and voluntary participation are unreliable
          or absent.
        </p>

        <h2>Evaluation Constraint</h2>

        <p>
          Only systems that persist due to enforced, non-voluntary structure or
          automation qualify. Benefit must be durable and intrinsic to operation,
          not aspirational or belief-dependent.
        </p>

        <p>
          Any system requiring ongoing human intent, interpretation, coordination,
          or goodwill is excluded.
        </p>

        <h2>Stability Regimes</h2>

        <h3>Regime A — Persistence Stability (Without People)</h3>

        <ul>
          <li>Non-negotiable physical, logical, or safety-critical constraints</li>
          <li>Automation that executes without belief, intent, or oversight</li>
          <li>Mutual dependency with no unilateral exit</li>
        </ul>

        <h3>Regime B — Participation Stability (With People Present)</h3>

        <p>
          Systems in this regime are not substrate. They remain stable only while
          humans are present and only if all of the following are enforced:
        </p>

        <ul>
          <li>Visible structural safety and hard boundaries</li>
          <li>Predictable, transparent governance and enforcement</li>
          <li>Clear roles, escalation paths, and accountability</li>
          <li>Low-stakes interaction preceding higher-risk engagement</li>
          <li>Inclusion and accessibility that minimize social threat</li>
        </ul>

        <h2>Reality-First Design Loop</h2>

        <ol>
          <li>
            <strong>Define the Anchor Problem</strong>
            <br />
            Specify a non-negotiable human survival need.
          </li>
          <li>
            <strong>Establish Physical or Logical Enforcement</strong>
            <br />
            Operation must be governed by physical law, automation, or mutual
            dependency.
          </li>
          <li>
            <strong>Identify Robust, Passive Mechanisms</strong>
            <br />
            Redundancy and feedback must be intrinsic. No expert dependency.
          </li>
          <li>
            <strong>Scope to an Initial Feasible Prototype</strong>
            <br />
            The system must be small, closed, and self-contained.
          </li>
          <li>
            <strong>Define Monitoring and Failure Gates</strong>
            <br />
            Failure thresholds must be explicit and detectable without
            interpretation.
          </li>
          <li>
            <strong>Binary Survivorship Test</strong>
            <br />
            Assume total human disengagement. If function degrades due to absence
            of care, the system is not substrate.
          </li>
        </ol>

        <h2>Canonical Evaluation Outcome</h2>

        <p>
          A system either qualifies as substrate or it does not. Conditional
          survivorship is not survivorship.
        </p>

        <p>
          Failure modes are treated as hard boundaries, not opportunities for
          ingenuity, adaptation, or workaround.
        </p>

        <h2>Disallowed Interpretations</h2>

        <ul>
          <li>No speculative remediation</li>
          <li>No optimization guidance</li>
          <li>No user-centered reframing</li>
          <li>No narrative justification</li>
          <li>No moral persuasion</li>
        </ul>

        <h2>Foundational Insight</h2>

        <p>
          Deployment is the dominant and often invisible human dependency. If
          placement, setup, calibration, or interpretation is required for safe
          operation, human agency has been reintroduced and substrate qualification
          fails.
        </p>

        <h2>Status</h2>

        <p>
          This document is a canonical reference. Divergence from this evaluation
          chain constitutes a change in assumptions, not a disagreement.
        </p>

        <p>
          No adjustment necessary.
        </p>
      </article>
    </main>
  );
}
