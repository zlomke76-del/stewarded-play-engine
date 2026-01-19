// app/governance-audit/page.tsx
// ============================================================
// MORAL CLARITY GOVERNANCE AUDIT™
// Governance where safety, ethics, and alignment stop working
// ============================================================
// Public-facing positioning page
// Non-advisory · Regime-bounded · Updated only by explicit revision
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Moral Clarity Governance Audit™ | Moral Clarity AI",
  description:
    "A regime-bounded governance diagnostic identifying drift, incentive corruption, coordination failure, and epistemic blind spots under uncertainty.",
  openGraph: {
    title: "Moral Clarity Governance Audit™",
    description:
      "Governance where safety, ethics, and alignment frameworks stop working.",
    url: "https://moralclarity.ai/governance-audit",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function GovernanceAuditPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Moral Clarity Governance Audit™</h1>

        <p className="lead">
          <strong>
            Governance where safety, ethics, and alignment stop working.
          </strong>
        </p>

        <p className="text-sm text-red-700 dark:text-red-400">
          <b>Boundary Notice:</b> This offering is regime-bounded and diagnostic
          in nature. It does not provide compliance certification, technical
          assurance, or operational guarantees.
        </p>

        {/* PRIMARY CTA — TOP */}
        <div className="my-8">
          <a
            href="https://calendly.com/zlomke76/governance-drift-audit-intake-call"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-black px-6 py-3 text-white font-medium hover:bg-neutral-800"
          >
            Book a Governance &amp; Drift Audit Intake Call
          </a>
          <p className="mt-2 text-sm text-neutral-500">
            A $500 deposit is required to reserve an intake slot and is applied
            to the final audit fee.
          </p>
        </div>

        {/* OVERVIEW */}
        <h2>What This Is</h2>
        <p>
          The <strong>Moral Clarity Governance Audit™</strong> is a short-cycle,
          high-signal diagnostic designed to identify where organizations lose
          the ability to govern before visible failure occurs.
        </p>
        <p>
          Most safety, ethics, and alignment frameworks assume that institutions
          can still detect problems, decide coherently, and enforce
          accountability as systems grow complex.
        </p>
        <p>
          In practice, those capacities often fail first.
        </p>

        {/* WHAT IT EXAMINES */}
        <h2>What This Audit Examines</h2>
        <ul>
          <li>
            <strong>Incentive corruption:</strong> Where reward structures favor
            denial, speed, or plausible deniability over correction
          </li>
          <li>
            <strong>Detection failure:</strong> Whether early warnings can
            surface — and whether they are permitted to
          </li>
          <li>
            <strong>Authority breakdown:</strong> Where responsibility exists in
            theory but not in practice
          </li>
          <li>
            <strong>Procedural entrenchment:</strong> Where process replaces
            judgment and blocks adaptation
          </li>
          <li>
            <strong>Action threshold collapse:</strong> Where decisions arrive
            too late, too fast, or not at all
          </li>
          <li>
            <strong>Meta-failure of knowledge systems:</strong> Where meaning,
            interpretation, and enforcement diverge
          </li>
        </ul>

        {/* WHAT IT IS NOT */}
        <h2>What This Audit Is Not</h2>
        <ul>
          <li>Not an AI safety checklist</li>
          <li>Not an ethics or values workshop</li>
          <li>Not a compliance certification</li>
          <li>Not a technical model review</li>
        </ul>

        <p>
          This audit does not ask whether systems align with stated principles.
          It asks whether governance still functions when those principles are
          stressed.
        </p>

        {/* DELIVERABLES */}
        <h2>Deliverables</h2>
        <ul>
          <li>
            A written governance audit identifying drift vectors, accountability
            gaps, detection blind spots, and non-governable risk
          </li>
          <li>
            A 60-minute executive debrief focused on what can be governed, what
            requires redesign, and what must be explicitly refused
          </li>
        </ul>

        {/* WHEN IT MATTERS */}
        <h2>When This Matters Most</h2>
        <ul>
          <li>When systems are partially or fully opaque</li>
          <li>When incentives are misaligned or adversarial</li>
          <li>When responsibility is distributed or unclear</li>
          <li>
            When performance metrics appear healthy but confidence is eroding
          </li>
        </ul>

        {/* BOUNDARY STATEMENT */}
        <h2>Boundary Statement</h2>
        <p>
          When interpretability, alignment, or ethical intent cannot be relied
          upon, governance must still function.
        </p>
        <p>
          <strong>Moral Clarity exists at that boundary.</strong>
        </p>

        {/* CANONICAL CONTEXT */}
        <h2>Canonical Context</h2>
        <p>
          This audit is grounded in the{" "}
          <Link href="/edge-of-knowledge">Edge of Knowledge</Link> research
          series, which examines failure, uncertainty, and responsible action
          where optimization breaks.
        </p>

        {/* SECONDARY CTA — BOTTOM */}
        <div className="my-10">
          <a
            href="https://calendly.com/zlomke76/governance-drift-audit-intake-call"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Reserve an Audit Intake Slot
          </a>
          <p className="mt-2 text-sm text-neutral-500">
            Intake calls are limited and gated. This is a diagnostic, not a
            sales conversation.
          </p>
        </div>

        <hr />

        <p className="text-sm text-neutral-400">
          Moral Clarity Governance Audit™ · Public reference · Updated only by
          explicit revision. No claims of prevention, prediction, or assurance
          are made or implied.
        </p>
      </article>
    </main>
  );
}
