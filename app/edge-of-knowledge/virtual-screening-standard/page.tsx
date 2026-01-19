// app/edge-of-knowledge/virtual-screening-standard/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE
// Reliability & Governance Standard
// CLIP-Based Virtual Drug Screening
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Reliability & Governance Standard for CLIP-Based Virtual Drug Screening | Moral Clarity AI",
  description:
    "Methods-level standards for calibration, reproducibility, interpretability, and auditability in CLIP-based virtual drug screening pipelines.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function VirtualScreeningStandardPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article
        className="
          prose prose-neutral dark:prose-invert max-w-none
          prose-h1:tracking-tight
          prose-h2:tracking-tight
          prose-a:underline prose-a:font-medium
          prose-a:text-blue-600 dark:prose-a:text-blue-400
        "
      >
        <h1>
          Reliability &amp; Governance Standard for CLIP-Based Virtual Drug
          Screening
        </h1>

        <p className="text-sm text-neutral-500">
          Edge of Knowledge · Methods &amp; Standards · Public Draft v1.0
        </p>

        <h2>Purpose</h2>
        <p>
          This document defines a set of non-expansive, implementation-agnostic
          operational standards intended to improve the reliability,
          reproducibility, interpretability, and auditability of CLIP-based
          virtual drug screening pipelines. It addresses recurring failure modes
          observed in large-scale computational screening without altering
          underlying scientific claims or substituting for experimental
          validation.
        </p>

        <h2>Scope</h2>
        <p>
          These standards apply to virtual screening systems that employ joint
          protein–ligand embedding or similarity-based retrieval architectures,
          including CLIP-inspired models. The controls described herein operate
          at the workflow and system-behavior level and are designed to coexist
          with diverse model architectures, datasets, and institutional
          environments.
        </p>

        <h2>Enumerated Controls</h2>

        <h3>1. Retrieval Calibration Layer</h3>
        <p>
          Post-retrieval similarity scores SHOULD be calibrated (e.g., via
          isotonic or temperature scaling) prior to final candidate ranking.
          Calibration mitigates overconfident embedding tails and stabilizes
          ranking behavior across targets and repeated runs.
        </p>

        <h3>2. Negative Sampling Discipline</h3>
        <p>
          Training pipelines SHOULD incorporate disciplined hard-negative
          sampling using structurally plausible non-binders. This control
          improves discrimination beyond naive similarity and reduces
          false-positive enrichment.
        </p>

        <h3>3. Pocket–Ligand Interaction Decomposition</h3>
        <p>
          Candidate scores SHOULD be decomposable into interpretable components,
          such as pocket geometry alignment, chemical feature compatibility, and
          learned interaction residuals. This enables expert review and
          mechanism-based triage.
        </p>

        <h3>4. Failure-Mode Logging</h3>
        <p>
          Systems SHOULD log exclusion and rejection events with explicit
          reasons, including confidence thresholds, uncertainty measures, and
          score variance. Failure-mode logging supports iterative improvement
          and transparent error analysis.
        </p>

        <h3>5. Determinism Envelope</h3>
        <p>
          A determinism mode SHOULD be available, enforcing fixed random seeds,
          frozen model weights, and pinned dependencies. This enables exact
          reproducibility for demonstrations, cross-institutional comparison,
          and regulatory review.
        </p>

        <h3>6. Golden-Set Regression Tests</h3>
        <p>
          Screening pipelines SHOULD maintain non-negotiable regression tests
          against benchmark protein–ligand pairs. Golden sets enforce
          non-regression guarantees and defend against silent performance drift
          during system evolution.
        </p>

        <h2>Explicit Boundaries</h2>
        <ul>
          <li>
            These standards do not introduce autonomous decision-making or
            validation.
          </li>
          <li>
            Computational outputs are not treated as biological or clinical
            conclusions.
          </li>
          <li>
            Wet-lab validation and expert review remain mandatory downstream
            steps.
          </li>
          <li>
            No performance, speed, scale, or discovery claims are asserted.
          </li>
        </ul>

        <h2>Status &amp; Versioning</h2>
        <p>
          This document is released as a public draft (v1.0). It is intended to
          be versioned, auditable, and incrementally refined in response to
          community, institutional, and regulatory needs while preserving its
          non-expansive scope.
        </p>

        <h2>Citation</h2>
        <p>
          When referencing this standard, cite as:
          <br />
          <em>
            “Reliability &amp; Governance Standard for CLIP-Based Virtual Drug
            Screening, Edge of Knowledge, Moral Clarity AI, v1.0.”
          </em>
        </p>
      </article>
    </main>
  );
}
