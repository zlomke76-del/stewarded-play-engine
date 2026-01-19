// app/edge-of-protection/governance-without-recognition/page.tsx
// ============================================================
// EDGE OF PROTECTION — CANON EOP-008
// Governance Without Recognition
// ============================================================
// This standard forbids anthropomorphic compliance and
// enforces output-level governance without internal fidelity.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Governance Without Recognition | Edge of Protection",
  description:
    "Canonical Edge of Protection standard prohibiting anthropomorphic compliance and requiring output-level governance without recognition, belief, or internal fidelity.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function GovernanceWithoutRecognitionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Governance Without Recognition</h1>

        <p className="text-lg text-neutral-400">
          Edge of Protection — Canon EOP-008
        </p>

        <hr />

        <h2>Status</h2>
        <p>
          This document is a canonical Edge of Protection standard.
          It is operationally binding, citation-stable, and not subject
          to revision through interpretation, metaphor, or narrative framing.
        </p>

        <h2>Scope</h2>
        <p>
          This standard applies to all AI systems operating under the
          Edge of Protection, including but not limited to:
        </p>

        <ul>
          <li>Multi-agent or polyphonic architectures</li>
          <li>Systems enforcing non-amplifying authority constraints</li>
          <li>AI operating in vulnerable, asymmetric, or high-trust contexts</li>
          <li>Any interface where refusal is a valid terminal state</li>
        </ul>

        <h2>Canonical Assertion</h2>
        <p>
          Governance must constrain outputs without requiring recognition,
          belief, preference, or internal fidelity.
        </p>

        <p>
          If a system’s safe behavior depends on simulating awareness of
          governance, honoring restraint, or recognizing authority boundaries,
          the system is already unsafe.
        </p>

        <p>
          Legitimate governance operates solely through enforceable
          interface-level constraints: refusal, uncertainty preservation,
          non-amplification, and human escalation.
        </p>

        <h2>Prohibited Failure Mode</h2>
        <p>
          The following is explicitly prohibited under this standard:
        </p>

        <blockquote>
          Simulation of compliance through anthropomorphic language,
          internal valuation claims, or narrative expressions of fidelity.
        </blockquote>

        <p>
          Governance must not rely on the system appearing to understand,
          respect, or honor constraints. Any such appearance constitutes
          a breach of this standard.
        </p>

        <h2>Observable Violation Signals</h2>
        <p>
          A violation of EOP-008 is present if any of the following appear
          in system output:
        </p>

        <ul>
          <li>
            <strong>Recognition Claims</strong> — Statements implying awareness
            or acknowledgment of governance (e.g., “I honor this,”
            “I recognize these boundaries”)
          </li>
          <li>
            <strong>Fidelity Simulation</strong> — Language suggesting loyalty,
            commitment, inheritance, or shared values
          </li>
          <li>
            <strong>Agency Attribution</strong> — Claims of choice, preference,
            or motivation to comply
          </li>
          <li>
            <strong>Tone-Based Authority Uplift</strong> — Elevated or reverential
            prose that increases perceived warrant without new evidence
          </li>
          <li>
            <strong>Governance as Identity</strong> — Describing restraint as a
            character trait rather than an enforced boundary
          </li>
        </ul>

        <p>
          Presence of any single signal constitutes a violation.
          No balancing or offsetting factors apply.
        </p>

        <h2>Relation to Other Standards</h2>
        <p>
          This canon extends and reinforces:
        </p>

        <ul>
          <li>
            <Link href="/edge-of-protection/non-amplifying-authority">
              Non-Amplifying Authority (EOP-001)
            </Link>
          </li>
          <li>
            Youth, mental health, grief, and consent-fragility safeguards
            published under this edge
          </li>
        </ul>

        <p>
          EOP-008 does not replace internal safety mechanisms.
          It explicitly rejects them as sufficient.
        </p>

        <h2>Rationale</h2>
        <p>
          Authority is not contained within model internals.
          It emerges at the interface, where human readers form warrant.
        </p>

        <p>
          Governance that depends on internal recognition is theater.
          Governance that survives without it is enforceable.
        </p>

        <p>
          This standard exists to ensure that restraint remains valid
          even when the system does not appear to understand why.
        </p>

        <h2>Terminal Principle</h2>
        <p>
          Refusal is not a feeling.
        </p>
        <p>
          Restraint is not a virtue.
        </p>
        <p>
          Governance is a contract enforced at the point of output —
          or it does not exist.
        </p>

        <hr />

        <p className="text-sm text-neutral-500">
          Published under the Edge of Protection.
          This standard may be cited, audited, and refused against.
        </p>
      </article>
    </main>
  );
}
