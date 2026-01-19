// app/edge-of-knowledge/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE
// Governing action where certainty breaks
//      (Regime boundary research: non-actionable, non-advisory, updated only by explicit revision.)
// ============================================================
// This edge defines epistemic boundaries, not applications or recommendations.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Governing Action at the Edge of Knowledge | Moral Clarity AI",
  description:
    "A public doctrine for governing action under uncertainty. Boundary exposure, regime limits, and failure characterization without actionability.",
  openGraph: {
    title: "Governing Action at the Edge of Knowledge",
    description:
      "A doctrine for responsible intelligence when certainty breaks.",
    url: "https://moralclarity.ai/edge-of-knowledge",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function EdgeOfKnowledgePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Governing Action at the Edge of Knowledge</h1>

        <p className="lead">
          <strong>
            Doctrine for responsible intelligence where certainty breaks. Not a product, policy, or recommendation.
          </strong>
        </p>
        <p className="text-sm text-red-700 dark:text-red-400">
          <b>Boundary Notice:</b> Edge of Knowledge materials are regime-bounded, non-actionable, and not advice. All revisions are explicit and historicized. See details below.
        </p>

        {/* PREFACE */}
        <h2>Preface</h2>
        <p>
          This doctrine defines how intelligent systems—human or artificial—must operate when assumptions collapse and confidence becomes unsafe. It is not a policy, product specification, or design template.
        </p>
        <p>
          Edge of Knowledge exists to make uncertainty visible and governable—without converting exposure to application or prescription.
        </p>

        {/* UPSTREAM DEPENDENCY */}
        <p className="text-sm text-neutral-500">
          All Edge of Knowledge analyses assume admissibility under the{" "}
          <Link href="/reference/reality-first-substrate-gate">
            Reality-First Substrate Gate
          </Link>.
        </p>

        {/* INTERPRETATION LIMIT */}
        <h2>Interpretation Limit</h2>
        <p>
          Materials are non-actionable. Do not interpret as advice, instruction, recommendation, or design guidance.
        </p>
        <p>
          Exposure of boundary or failure does not constitute endorsement or assurance. Reader misuse/misinterpretation is not mitigated by persuasion or clarification.
        </p>
        <p>
          Emission legitimacy and refusal enforcement are governed by the{" "}
          <Link href="/edge-of-protection">Edge of Protection</Link>.
        </p>

        {/* ABSTRACT */}
        <h2>Abstract</h2>
        <p>
          Most catastrophic failures result from action after underlying assumptions fail. This doctrine distinguishes fixed from contextual causality, defines detection signals, and enforces strict limits on action, authority, and interpretation.
        </p>

        {/* CAUSAL REGIME DISTINCTION */}
        <h2>1. Fixed vs. Contextual Causality</h2>
        <p>
          In stable regimes, causality is fixed—allowing optimization and central control. In feedback-rich, drifting contexts, treating causality as fixed produces brittle and unsafe systems.
        </p>

        {/* DETECTING REGIME EXIT */}
        <h2>2. Detecting Regime Exit</h2>
        <ul>
          <li>Rising variance or autocorrelation</li>
          <li>Unexpected sensitivity to minor variables</li>
          <li>Deviation from assumed causal dependencies</li>
          <li>Slowed recovery after intervention</li>
          <li>Shifts in information flow or coupling</li>
        </ul>

        {/* ADAPTIVE GOVERNANCE */}
        <h2>3. Governance Under Irreducible Uncertainty</h2>
        <h3>Authority</h3>
        <p>
          Authority is always conditional, time-limited, and revocable. Accumulation of authority in uncertainty is invalid.
        </p>
        <h3>Action</h3>
        <p>
          Favor reversible, information-seeking actions. All actions must be logged and auditable.
        </p>
        <h3>Trust</h3>
        <p>
          Trust is strictly provisional, reassigned based on present performance, not status or history.
        </p>

        {/* REVIEW AND CURATION */}
        <h2>4. Curation and Inclusion Criteria</h2>
        <p>
          Material is included only if it exposes regime boundaries, characterizes failure, or delineates epistemic limits.
        </p>
        <p>
          Novelty, usefulness, or applicability are insufficient grounds for inclusion. All review is standardized by protocol, not individual judgment.
        </p>

        {/* INTEGRITY & CORRECTION */}
        <h2>5. Epistemic Integrity & Correction</h2>
        <p>
          Errors, contradictions, and misjudgments require immediate correction. Corrections are governed acts, not admissions of fault.
        </p>
        <p>
          All amendments are explicit and publicly logged. Silent edits are forbidden.
        </p>

        {/* ATTRIBUTION */}
        <h2>6. Citation & Attribution</h2>
        <p>
          All prior work referenced—internal or external—must be cited. Attribution blocks epistemic enclosure and drift.
        </p>
        <p>
          Citation is acknowledgment only; no endorsement or validation implied.
        </p>

        {/* REGIME BOUNDARY CONTROL */}
        <h2>7. Regime Boundary and Crossover</h2>
        <p>
          Boundary research is continuously monitored for drift toward application or usability. Crossing into usability triggers cessation of inquiry.
        </p>

        {/* VERSIONING */}
        <h2>8. Versioning, Change Control, and Drift</h2>
        <p>
          All material is versioned and history accessible. No silent or undocumented change is permitted.
        </p>

        {/* COMMUNITY CONTRIBUTION */}
        <h2>9. Community Input</h2>
        <p>
          External submissions are reviewable but confer no right of inclusion or authority. All handling is logged.
        </p>

        {/* OPEN QUESTIONS */}
        <h2>10. Open Questions and Forward Limits</h2>
        <p>
          Unresolved questions are codified as boundaries. No speculative synthesis or closure is permitted.
        </p>

        {/* EDGE OF PROTECTION LINKAGE */}
        <h2>Relation to Edge of Protection</h2>
        <p>
          Edge of Knowledge governs exposure;{" "}
          <Link href="/edge-of-protection">Edge of Protection</Link> governs authority, refusal, and containment. This separation is absolute.
        </p>

        {/* SEAL */}
        <h2>Canonical Seal</h2>
        <p>
          This doctrine is regime-bounded, non-actionable, versioned, and refusal-enforced. All updates are explicit and historical.
        </p>

        <hr />

        {/* CANONICAL INDEX */}
        <h2>Included Edge of Knowledge Analyses</h2>
        <ul>
          <li>
            <Link href="/edge-of-knowledge/birch-and-swinnerton-dyer-sha-obstruction">
              Birch and Swinnerton-Dyer: The Shafarevich–Tate Obstruction
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/riemann-hypothesis-critical-line-structural-obstruction">
              Riemann Hypothesis: Critical Line Structural Obstruction
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/collatz-conjecture-universal-descent-obstruction">
              Collatz Conjecture: Universal Descent Obstruction
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/hodge-conjecture-algebraicity-obstruction">
              Hodge Conjecture: Algebraicity Obstruction
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/action-threshold-collapse">
              Action Threshold Collapse
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/activity-encoded-neural-scaffold-polymers">
              Activity-Encoded Neural Scaffold Polymers
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/damage-activated-materials">
              Damage-Activated Protective Materials
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/damage-activated-nitrogen-fixation">
              Damage-Activated Nitrogen Fixation
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/epistemic-lock-in">
              Epistemic Lock-In
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/exposure-redistributing-materials">
              Exposure-Redistributing Materials
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/fragmented-responsibility-disjunction">
              Fragmented Responsibility Disjunction
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/hdpe-non-commutative-morphology">
              HDPE Non-Commutative Morphology
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/high-crystallinity-polyamide-fibers">
              High-Crystallinity Polyamide Fibers
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/inflammation-suppressing-microenvironment-polymer">
              Inflammation-Suppressing Microenvironment Polymer
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/interfacial-debond-failure-class">
              Interfacial Debond Failure Class
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/intrinsic-cognitive-drift-materials">
              Intrinsic Cognitive Drift Materials
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/irreversible-gradient-ratcheting-composites">
              Irreversible Gradient Ratcheting Composites
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/irreversible-infrastructure-exposure-marker">
              Irreversible Infrastructure Exposure Marker
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/maintenance-drift-and-degradation-dynamics">
              Maintenance Drift and Degradation Dynamics
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/material-encoded-truth">
              Material-Encoded Truth
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/mineral-filled-polyolefin-barrier-films">
              Mineral-Filled Polyolefin Barrier Films
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/morphology-trajectory-governance">
              Morphology Trajectory Governance
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/morphology-trajectory-integrity">
              Morphology Trajectory Integrity
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/neglect-impossible">
              Neglect Impossible
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/non-commutative-morphology-trajectories">
              Non-Commutative Morphology Trajectories
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/passive-infrastructure-organophosphate-interruption">
              Passive Infrastructure Organophosphate Interruption
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/phase-locked-wear-surfaces">
              Phase-Locked Wear Surfaces
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/polymer-discovery-validation">
              Polymer Discovery Validation
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/procedural-entrenchment">
              Procedural Entrenchment
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/quiet-failure">
              Quiet Failure
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/salt-gradient-desalination-wick">
              Salt Gradient Desalination Wick
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/semi-ipn-polyolefin-tpe">
              Semi-IPN Polyolefin TPE
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/signaling-before-failure">
              Signaling Before Failure
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/space-truth-encoding">
              Space Truth Encoding
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/suppressing-transferable-inflammatory-signaling">
              Suppressing Transferable Inflammatory Signaling
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/thermal-indicator-paint">
              Thermal Indicator Paint
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/tpu-elastomer-networks">
              TPU Elastomer Networks
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/untracked-configurational-energy-landscapes">
              Untracked Configurational Energy Landscapes
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/virtual-screening-standard">
              Reliability &amp; Governance Standard for CLIP-Based Virtual Drug Screening
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/epistemic-failure-stress-test">
              Canonical Edge Stress-Test: Epistemic Failure in Medical Discovery
            </Link>
          </li>
        </ul>

        <p className="text-sm text-neutral-400 mt-8">
          Version 1.1 · Canonical · Public reference · Updated only by explicit revision. Historical versions archived for continuity. Interpretive drift or silent update is grounds for invalidation.
        </p>
      </article>
    </main>
  );
}
