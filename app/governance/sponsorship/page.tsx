// app/governance/sponsorship/page.tsx
// ============================================================
// SPONSORSHIP CHARTER
// Canonical, public, crawlable
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sponsorship Charter | Moral Clarity AI",
  description:
    "The Moral Clarity AI Sponsorship Charter defines ethical sponsorship, non-ownership support, governance boundaries, and transparency commitments.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Sponsorship Charter | Moral Clarity AI",
    description:
      "A principled framework for supporting Moral Clarity AI without ownership, control, or extraction.",
    url: "https://www.moralclarity.ai/governance/sponsorship",
    siteName: "Moral Clarity AI",
    type: "article",
  },
};

export const dynamic = "force-static";

export default function SponsorshipCharterPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Moral Clarity AI</h1>
        <h2>Sponsorship Charter</h2>

        <p className="text-lg text-neutral-400">
          A framework for ethical sponsorship, stewardship support, and
          long-term independence.
        </p>

        <hr />

        <h3>Purpose</h3>
        <p>
          This Charter defines the nature of sponsorship for Moral Clarity AI.
          Sponsorship exists to support stewardship, infrastructure, and
          propagation of the Artifact without transferring ownership,
          governance authority, or extractive rights.
        </p>

        <h3>What Sponsorship Is</h3>
        <p>Sponsorship is non-controlling support provided to sustain:</p>
        <ul>
          <li>Stewardship and governance labor</li>
          <li>Infrastructure and operational stability</li>
          <li>Research, audits, and safety work</li>
          <li>Limited expansion and artifact propagation</li>
        </ul>

        <p>
          Sponsorship is not an investment vehicle, equity instrument, or
          governance role.
        </p>

        <h3>What Sponsorship Is Not</h3>
        <ul>
          <li>No ownership or equity</li>
          <li>No voting or governance authority</li>
          <li>No control over licensing decisions</li>
          <li>No influence over ethical standards</li>
          <li>No access to private user data</li>
          <li>No preferential extraction rights</li>
        </ul>

        <p>
          Sponsorship does not entitle a sponsor to product direction,
          ideological alignment, or brand influence.
        </p>

        <h3>Governance and Authority</h3>
        <p>
          Moral Clarity AI operates under a Stewardship model. Final authority
          over governance, licensing, and ethical boundaries resides with the
          Steward.
        </p>
        <p>
          Governance principles and authority are defined publicly in the
          <strong> Stewardship Agreement</strong>.
        </p>

        <p>
          <Link href="/governance/stewardship-agreement">
            View the Stewardship Agreement →
          </Link>
        </p>

        <h3>Transparency Commitments</h3>
        <p>Sponsors receive:</p>
        <ul>
          <li>Public access to governance documents</li>
          <li>
            Disclosure of material changes to governance or licensing posture
          </li>
          <li>
            High-level reporting on sponsorship use (non-confidential,
            non-user-specific)
          </li>
        </ul>

        <p>
          Transparency is designed to ensure trust without surveillance or
          control.
        </p>

        <h3>Licensing Separation</h3>
        <p>
          Sponsorship is structurally separate from licensing. Sponsorship does
          not guarantee access, integration, or commercial advantage.
          Licensing, if pursued, is evaluated independently.
        </p>

        <h3>Ethical Boundaries</h3>
        <p>
          Moral Clarity AI will not accept sponsorship that seeks ownership,
          control, extraction, ideological compliance, or compromise of
          neutrality, refusal integrity, or safety.
        </p>

        <h3>Term and Withdrawal</h3>
        <p>
          Sponsorship may be paused or withdrawn by either party with notice.
          Withdrawal does not affect governance authority or licensing posture.
          No penalties apply.
        </p>

        <h3>Statement of Intent</h3>
        <p>
          Sponsorship is an act of support, not capture. Sponsors participate
          because they believe some systems should remain governed, not owned;
          that ethical infrastructure requires independence; and that
          stewardship is legitimate labor.
        </p>

        <hr />

        <p className="text-sm text-neutral-500">
          This document is public, canonical, and versioned. Legal instruments
          may be derived where required but do not supersede this Charter.
        </p>
      </article>
    </main>
  );
}
