// app/edge-of-knowledge/detection-before-damage/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE
// Epistemic Instrumentation — Detection Before Damage
// (Regime-bounded analysis of wrongness detection prior to irreversible harm)
// ============================================================
// Non-actionable · Non-advisory · Explicit limits · Versioned
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Detection Before Damage | Edge of Knowledge",
  description:
    "Formal instrumentation for detecting wrongness before irreversible damage occurs. Regime-bounded, non-actionable analysis.",
  openGraph: {
    title: "Detection Before Damage — Epistemic Instrumentation",
    description:
      "Structured mechanisms for surfacing error, drift, and instability prior to irreversible harm.",
    url: "https://moralclarity.ai/edge-of-knowledge/detection-before-damage",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function DetectionBeforeDamagePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Detection Before Damage</h1>

        <p className="lead">
          <strong>
            Epistemic instrumentation for identifying wrongness before
            irreversible harm occurs. Not a product, policy, or recommendation.
          </strong>
        </p>

        <p className="text-sm text-red-700 dark:text-red-400">
          <b>Boundary Notice:</b> This material is regime-bounded and
          non-actionable. It defines detection constraints, not guarantees.
          Revisions are explicit and historicized.
        </p>

        {/* PREFACE */}
        <h2>Preface</h2>
        <p>
          Many system failures are not caused by sudden catastrophe, but by
          undetected error accumulating beyond a point of reversibility. This
          document formalizes mechanisms for detecting wrongness early enough to
          limit scope and harm, without assuming complete observability or
          perfect foresight.
        </p>

        <p>
          Detection Before Damage does not claim that all errors can be caught.
          It defines disciplined structures that reduce scale, duration, and
          downstream impact when failure is inevitable.
        </p>

        <p className="text-sm text-neutral-500">
          All analysis assumes admissibility under the{" "}
          <Link href="/reference/reality-first-substrate-gate">
            Reality-First Substrate Gate
          </Link>
          .
        </p>

        {/* INTERPRETATION LIMIT */}
        <h2>Interpretation Limit</h2>
        <p>
          This material does not constitute operational guidance, compliance
          instruction, or safety assurance. It describes epistemic mechanisms,
          not implementation mandates.
        </p>

        <p>
          Detection does not imply prevention. Early signal does not guarantee
          successful intervention.
        </p>

        <p>
          Authority, enforcement, and refusal logic are governed by the{" "}
          <Link href="/edge-of-protection">Edge of Protection</Link>.
        </p>

        {/* ABSTRACT */}
        <h2>Abstract</h2>
        <p>
          Detection before damage depends on structured feedback, adversarial
          review, explicit indicators, and low-friction reporting pathways.
          These mechanisms operate under hard constraints imposed by complexity,
          resources, data quality, and human incentives. The objective is not
          elimination of error, but containment of harm.
        </p>

        {/* CORE MECHANISMS */}
        <h2>1. Systematic Early Feedback</h2>
        <p>
          Systems must surface information incrementally through staged
          deployment, pilot exposure, or bounded release. Early feedback
          environments reduce the cost of discovery and expose defects before
          scale amplifies impact.
        </p>

        <h2>2. Diverse and Adversarial Review</h2>
        <p>
          Detection requires dissent. Cross-disciplinary and adversarial review
          interrupts assumption lock-in and reveals fragility that consensus
          environments suppress.
        </p>

        <h2>3. Monitoring and Indicator Tracking</h2>
        <p>
          Key indicators must be explicitly defined to surface deviation,
          instability, or unexpected coupling. Dashboards and alerts are only
          effective when tied to pre-declared anomaly conditions.
        </p>

        <h2>4. Explicit Error Reporting Pathways</h2>
        <p>
          Detection fails when reporting is stigmatized or costly. Systems must
          provide clear, low-friction pathways for surfacing uncertainty,
          suspicion, or minor inconsistency before escalation occurs.
        </p>

        <h2>5. Predictive and Scenario Analysis</h2>
        <p>
          Scenario modeling and stress analysis can reveal precursor patterns
          that precede failure. These tools do not predict outcomes; they
          illuminate vulnerability surfaces.
        </p>

        <h2>6. Regular Review and Audit</h2>
        <p>
          Interim reviews and independent audits provide structured pauses
          before irreversible commitments. These checkpoints formalize risk
          acknowledgment rather than post-hoc explanation.
        </p>

        {/* HARD CONSTRAINTS */}
        <h2>Hard Constraints and Limiting Factors</h2>
        <ul>
          <li>Finite time, attention, and personnel</li>
          <li>Systemic complexity masking signal</li>
          <li>Incomplete or noisy data</li>
          <li>Incentive pressure against surfacing bad news</li>
        </ul>

        {/* NON-CONCLUSIONS */}
        <h2>What Cannot Be Concluded</h2>
        <ul>
          <li>No mechanism guarantees detection before damage</li>
          <li>Unknown unknowns cannot be instrumented directly</li>
          <li>Cascading failures may exceed monitoring scope</li>
          <li>Trade-offs between speed, coverage, and cost persist</li>
        </ul>

        {/* SUMMARY */}
        <h2>Summary</h2>
        <p>
          Detection Before Damage formalizes how wrongness can be surfaced early
          enough to reduce harm, without claiming completeness or certainty.
          Disciplined feedback, adversarial review, explicit indicators, and
          audit checkpoints tighten epistemic control while respecting real
          limits.
        </p>

        {/* SEAL */}
        <h2>Canonical Seal</h2>
        <p>
          This analysis is regime-bounded, non-actionable, versioned, and
          refusal-enforced. All updates are explicit and historical.
        </p>

        <p className="text-sm text-neutral-400 mt-8">
          Version 1.0 · Canonical · Public reference · Updated only by explicit
          revision. Silent modification invalidates authority.
        </p>
      </article>
    </main>
  );
}
