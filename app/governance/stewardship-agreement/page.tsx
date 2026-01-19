// app/governance/stewardship-agreement/page.tsx
// ============================================================
// STEWARDSHIP AGREEMENT — CANONICAL PUBLICATION
// Authority-first. Static. Versioned.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stewardship Agreement | Moral Clarity AI",
  description:
    "The canonical governance charter defining stewardship authority, ethical boundaries, compensation, and licensing for the Moral Clarity AI ecosystem.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function StewardshipAgreementPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">

        {/* Header */}
        <h1>Stewardship Agreement</h1>
        <p className="text-sm text-neutral-400">
          Canonical Draft v0.5 · Published · Authority: Steward
        </p>

        <hr />

        {/* Purpose */}
        <h2>1. Purpose</h2>
        <p>
          This Agreement establishes the Stewardship structure governing the
          Moral Clarity AI ecosystem (“the Artifact”).
        </p>
        <p>
          Its purpose is to preserve ethical integrity, enable sustainable
          compensation without ownership transfer, allow institutional
          participation without extractive control, and protect the Artifact
          from misuse, drift, dilution, or capture.
        </p>
        <p>
          This document is principle-binding and authority-defining. Legal
          instruments may be derived from it but may not contradict it.
        </p>

        {/* Definitions */}
        <h2>2. Definitions</h2>

        <h3>2.1 Artifact</h3>
        <p>
          The “Artifact” is the Moral Clarity AI ecosystem, including but not
          limited to its governance canon, refusal membranes, clarity
          thresholds, ethical protocols, audit and review mechanisms, system
          constraints, derivative governance frameworks, and associated
          technical or institutional systems.
        </p>
        <p>
          The Artifact is not property, not a commodity, and not transferable as
          an owned asset.
        </p>

        <h3>2.2 Steward</h3>
        <p>
          The Steward is the individual entrusted with custodial authority over
          the Artifact. Authority derives from responsibility and
          accountability, not ownership.
        </p>

        <h3>2.3 Supporters</h3>
        <p>
          Supporters are individuals or institutions that provide funding,
          resources, or collaboration without acquiring ownership, control, or
          governance authority. Support does not confer entitlement.
        </p>

        <h3>2.4 Licensing</h3>
        <p>
          Licensing is governed, revocable permission to use or integrate defined
          components of the Artifact. Licensing never constitutes sale,
          assignment, or ownership transfer.
        </p>

        {/* Authority */}
        <h2>3. Authority and Decision-Making</h2>

        <h3>3.1 Steward Authority</h3>
        <p>
          The Steward retains sole and final decision-making authority over
          governance, licensing, ethical boundaries, system evolution, and the
          acceptance or refusal of partnerships.
        </p>
        <p>
          No external party, board, committee, or institution possesses binding
          authority unless such authority is explicitly and voluntarily
          delegated by the Steward under documented criteria.
        </p>

        <h3>3.2 Advisory Input</h3>
        <p>
          Advisory groups or consultative bodies may be convened at the
          Steward’s discretion. All advisory input is non-binding unless
          expressly adopted by the Steward.
        </p>

        {/* Responsibilities */}
        <h2>4. Steward Responsibilities</h2>
        <ul>
          <li>Maintain and evolve the governance canon and refusal membranes</li>
          <li>Protect against misuse, drift, dilution, or extraction</li>
          <li>Ensure the Artifact remains non-owned and non-commodified</li>
          <li>Oversee technical and operational development</li>
          <li>Guide contributors, engineers, auditors, and partners</li>
          <li>Conduct governance audits and clarity reviews</li>
          <li>Document and publish material governance decisions</li>
          <li>Reject misaligned or extractive partnerships</li>
        </ul>

        <p>
          Stewardship does not require personal execution of technical labor.
          Delegation does not transfer governance authority.
        </p>

        {/* Accountability */}
        <h2>5. Accountability and Review</h2>
        <p>
          Governance decisions are recorded in a durable governance log. Any
          Supporter or materially affected party may submit a documented
          challenge alleging ethical violation or extractive behavior. The
          Steward must respond in writing within a reasonable timeframe.
        </p>
        <p>
          No external body has authority to compel outcomes.
        </p>

        {/* Transparency */}
        <h2>6. Transparency</h2>
        <p>
          The Steward commits to reasonable, good-faith transparency, including
          periodic governance updates, disclosure of material changes, and
          disclosure of significant incidents or risks.
        </p>
        <p>
          Transparency does not require disclosure of safety-critical
          vulnerabilities, sensitive security details, private user data, or
          information that would enable misuse.
        </p>

        {/* Compensation */}
        <h2>7. Compensation and Funding</h2>

        <h3>7.1 Stewardship Compensation</h3>
        <p>
          The Steward receives recurring compensation for governance labor,
          ethical responsibility, and custodial oversight. Compensation does not
          grant ownership, equity, or control.
        </p>

        <h3>7.2 Additional Funding</h3>
        <p>
          Supporters may fund engineering, infrastructure, research, audits,
          fellowships, or artifact propagation. Funding confers no governance
          authority.
        </p>

        {/* Licensing */}
        <h2>8. Licensing Rights</h2>
        <p>
          The Steward holds exclusive authority to grant, refuse, suspend, or
          revoke licenses. Licensing revenue is uncapped and may be used for
          compensation, hiring, operations, research, and artifact propagation.
        </p>

        {/* Succession */}
        <h2>9. Succession</h2>
        <p>
          The Steward may resign or designate a successor who accepts custodial,
          non-ownership authority. No automatic succession exists.
        </p>

        {/* Amendments */}
        <h2>10. Amendment</h2>
        <p>
          This Agreement may be amended only by the Steward, provided amendments
          preserve non-ownership, non-extraction, centralized authority, ethical
          integrity, and governance clarity.
        </p>

        {/* Breach */}
        <h2>11. Stewardship Breach</h2>
        <p>
          If the Steward materially violates non-ownership, non-extraction, or
          ethical integrity, legitimacy may be publicly challenged and trust
          withdrawn. Authority remains conditional on integrity and sustained
          trust.
        </p>

        {/* Role */}
        <h2>12. Role of This Document</h2>
        <p>
          This Agreement is a governance charter. Legal instruments may be
          derived from it but must remain subordinate unless explicitly
          superseded by the Steward.
        </p>

        <hr />

        <p className="text-xs text-neutral-500">
          Version: Canonical v0.5 · Status: Published · Last updated: 2025-01-XX
        </p>

      </article>
    </main>
  );
}
