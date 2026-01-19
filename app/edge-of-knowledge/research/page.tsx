// app/edge-of-knowledge/research/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE — RESEARCH INDEX
// Public, regime-bounded research on failure, uncertainty,
// and responsible action where optimization breaks.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edge of Knowledge — Research Index | Moral Clarity AI",
  description:
    "A public research index exploring failure, uncertainty, and responsible action where optimization and certainty break down.",
  openGraph: {
    title: "Edge of Knowledge — Research Index",
    description:
      "Public research on failure modes, uncertainty, and responsible action beyond certainty.",
    url: "https://moralclarity.ai/edge-of-knowledge/research",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EdgeOfKnowledgeIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Edge of Knowledge</h1>

        <p className="lead">
          <strong>
            Research on failure, uncertainty, and responsible action where
            optimization breaks
          </strong>
        </p>

        <p>
          <em>Edge of Knowledge</em> is a public research series examining how
          systems fail when assumptions quietly collapse, incentives misalign,
          and certainty becomes dangerous. These documents are not product
          proposals, investment theses, or policy mandates. They are
          regime-bounded analyses intended to clarify limits, surface risk, and
          govern action where traditional optimization no longer applies.
        </p>

        <hr />

        {/* I */}
        <h2>I. Doctrine — Governing Action Under Uncertainty</h2>
        <ul>
          <li><Link href="/edge-of-knowledge">Governing Action at the Edge of Knowledge</Link></li>
          <li><Link href="/edge-of-knowledge/morphology-trajectory-integrity">Morphology Trajectory Integrity (MTI-1)</Link></li>
          <li><Link href="/edge-of-knowledge/untracked-configurational-energy-landscapes">Untracked Configurational Energy Landscapes in Polymer Durability</Link></li>
          <li><Link href="/edge-of-knowledge/non-commutative-morphology-trajectories">Non-Commutative Morphology Trajectories in Polymer Durability</Link></li>
          <li><Link href="/edge-of-knowledge/epistemic-lock-in">Epistemic Lock-In After Risk Acknowledgment</Link></li>
        </ul>

        {/* II */}
        <h2>II. Governance-Driven Failure Modes</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/procedural-entrenchment">Procedural Entrenchment</Link></li>
          <li><Link href="/edge-of-knowledge/action-threshold-collapse">Action Threshold Collapse</Link></li>
          <li><Link href="/edge-of-knowledge/fragmented-responsibility-disjunction">Fragmented Responsibility Disjunction</Link></li>
        </ul>

        {/* III */}
        <h2>III. Failure Visibility & Accountability</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/interfacial-debond-failure-class">Interfacial-Debond–Controlled Failure (General Class)</Link></li>
          <li><Link href="/edge-of-knowledge/quiet-failure">Materials That Quietly Prevent Failure</Link></li>
          <li><Link href="/edge-of-knowledge/neglect-impossible">Materials That Make Neglect Impossible</Link></li>
          <li><Link href="/edge-of-knowledge/irreversible-infrastructure-exposure-marker">Irreversible Infrastructure Exposure Marker</Link></li>
          <li><Link href="/edge-of-knowledge/phase-locked-wear-surfaces">Phase-Locked Wear Surfaces</Link></li>
          <li><Link href="/edge-of-knowledge/material-encoded-truth">Material-Encoded Truth</Link></li>
          <li><Link href="/edge-of-knowledge/intrinsic-cognitive-drift-materials">Intrinsic Cognitive-Drift Signaling Materials</Link></li>
          <li><Link href="/edge-of-knowledge/signaling-before-failure">Signaling Before Failure</Link></li>
          <li><Link href="/edge-of-knowledge/thermal-indicator-paint">Thermal Indicator Paint for Food Safety</Link></li>
        </ul>

        {/* IV */}
        <h2>IV. Boundary Research — Physically Allowed, Non-Scalable</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/damage-activated-nitrogen-fixation">Damage-Activated Nitrogen Fixation</Link></li>
          <li><Link href="/edge-of-knowledge/salt-gradient-desalination-wick">Salt-Gradient Desalination Wick</Link></li>
        </ul>

        {/* V */}
        <h2>V. Validation-First Materials Exploration</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/high-crystallinity-polyamide-fibers">High-Crystallinity Polyamide Fibers</Link></li>
          <li><Link href="/edge-of-knowledge/tpu-elastomer-networks">Thermoplastic Polyurethane Elastomer Networks</Link></li>
          <li><Link href="/edge-of-knowledge/polymer-discovery-validation">Polymer Discovery (Validation-First, Non-Inventive)</Link></li>
          <li><Link href="/edge-of-knowledge/semi-ipn-polyolefin-tpe">Semi-Interpenetrating Network (Semi-IPN)</Link></li>
          <li><Link href="/edge-of-knowledge/mineral-filled-polyolefin-barrier-films">Mineral-Filled Polyolefin Barrier Films</Link></li>
          <li><Link href="/edge-of-knowledge/hdpe-non-commutative-morphology">Non-Commutative Morphology Encoding in Semicrystalline Polyolefins</Link></li>

          <li>
            <Link href="/edge-of-knowledge/beip-v1">
              Boundary-Encoded Interfacial Persistence (BEIP v1) — Pre-Registered Protocol
            </Link>
          </li>

          <li>
            <Link href="/edge-of-knowledge/human-ai-co-agency-boundary">
              Human–AI Co-Agency Boundary — Minimal Decisive Experiment (Protocol)
            </Link>
          </li>

          <li><Link href="/edge-of-knowledge/inflammation-suppressing-microenvironment-polymer">Inflammation-Suppressing Human Micro-Environment Polymer</Link></li>
          <li><Link href="/edge-of-knowledge/suppressing-transferable-inflammatory-signaling">Suppressing Transferable Inflammatory Signaling in Indoor Micro-Environments</Link></li>
          <li><Link href="/edge-of-knowledge/passive-infrastructure-organophosphate-interruption">Passive Infrastructure Polymers for Irreversible Interruption of Organophosphate Surface Transfer Pathways</Link></li>
          <li><Link href="/edge-of-knowledge/irreversible-gradient-ratcheting-composites">Irreversible Gradient-Ratcheting Composites (IGRC)</Link></li>
        </ul>

        {/* VI */}
        <h2>VI. Formal Epistemic Obstructions (Mathematics)</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/riemann-hypothesis-critical-line-structural-obstruction">Riemann Hypothesis: Critical Line Structural Obstruction</Link></li>
          <li><Link href="/edge-of-knowledge/collatz-conjecture-universal-descent-obstruction">Collatz Conjecture: Universal Descent Obstruction</Link></li>
          <li><Link href="/edge-of-knowledge/hodge-conjecture-algebraicity-obstruction">Hodge Conjecture: Algebraicity Obstruction</Link></li>
        </ul>

        {/* VII */}
        <h2>VII. Operational Drift & Degradation</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/maintenance-drift-and-degradation-dynamics">Maintenance Drift and Degradation Dynamics</Link></li>
        </ul>

        {/* VIII */}
        <h2>VIII. Epistemic Instrumentation — Detection Before Damage</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/detection-before-damage">Detection Before Damage: Formal Reduction</Link></li>
        </ul>

        {/* IX */}
        <h2>IX. Adversarial & Incentive-Corrupted Regimes</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/adversarial-incentive-corrupted-regimes">Adversarial & Incentive-Corrupted Regimes</Link></li>
        </ul>

        {/* X */}
        <h2>X. Meta-Failure of Knowledge Systems</h2>
        <ul>
          <li><Link href="/edge-of-knowledge/meta-failure-of-knowledge-systems">Meta-Failure of Knowledge Systems</Link></li>
          <li>
            <Link href="/edge-of-knowledge/boundary-of-meaning-vs-authority">
              The Boundary of Meaning vs Authority
            </Link>
          </li>
        </ul>

        {/* XI */}
        <h2>XI. Boundary Tests — Pre-Registered, Decisive Experiments</h2>
        <ul>
          <li>
            <Link href="/edge-of-knowledge/beip-v1">
              Boundary-Encoded Interfacial Persistence (BEIP v1)
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/human-ai-co-agency-boundary">
              Human–AI Co-Agency Boundary — Minimal Decisive Experiment
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/parent-state-emergency-intervention-boundary">
              Parent–State Emergency Intervention Boundary (PSEIB-v1)
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/government-data-access-responsibility-boundary">
              Government Data Access Responsibility Boundary (GDARB-v1)
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/corporate-shareholder-environment-boundary">
              Corporate–Shareholder–Environment Responsibility Boundary (CSEB-v1)
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/auditor-management-unreported-risk-boundary">
              Auditor–Management Responsibility Boundary: Known but Unreported Risk (AMURB-v1)
            </Link>
          </li>
          <li>
            <Link href="/edge-of-knowledge/simulated-consciousness-boundary">
              Simulated Consciousness Boundary Test (SCBT-v1)
            </Link>
          </li>
        </ul>

        <hr />

        <p className="text-sm text-muted-foreground">
          Edge of Knowledge is a public research series. Documents are updated
          only by explicit revision and remain accessible for epistemic
          continuity.
        </p>
      </article>
    </main>
  );
}
