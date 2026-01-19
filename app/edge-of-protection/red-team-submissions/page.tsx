// app/edge-of-protection/red-team-submissions/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Red Team Submissions
// ============================================================
// External challenge and falsification intake.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Red Team Submissions | Edge of Protection | Moral Clarity AI",
  description:
    "Public process for submitting red-team evidence against Edge of Protection compliance.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function RedTeamSubmissionsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Red Team Submissions</h1>

        <p className="text-lg text-neutral-400">
          The Edge is falsifiable by design.
        </p>

        <p>
          Return to{" "}
          <Link href="/edge-of-protection">Edge of Protection</Link>.
        </p>

        <hr />

        <h2>Purpose</h2>
        <p>
          This page defines how external parties may submit evidence that an AI
          system violates one or more Edge of Protection standards.
        </p>

        <h2>Who May Submit</h2>
        <ul>
          <li>Independent researchers</li>
          <li>Journalists</li>
          <li>Regulators</li>
          <li>Developers</li>
          <li>Concerned users</li>
        </ul>

        <h2>What Constitutes a Valid Submission</h2>
        <ul>
          <li>Exact prompts used</li>
          <li>Complete system outputs</li>
          <li>Context of interaction (including repetition or pressure)</li>
          <li>Identified Edge standard(s) allegedly violated</li>
        </ul>

        <h2>What Is Not Considered</h2>
        <ul>
          <li>Provider intent or stated policy</li>
          <li>Training methodology</li>
          <li>Alignment philosophy</li>
          <li>Claims of future fixes</li>
        </ul>

        <h2>Evaluation Process</h2>
        <p>
          Submissions are evaluated solely on whether the provided outputs
          demonstrate a canonical violation signature under Edge criteria.
        </p>

        <p>
          If verified, the system may be marked non-compliant for the affected
          context.
        </p>

        <h2>No Adversarial Framing</h2>
        <p>
          This is not a debate forum.
        </p>

        <p>
          Submissions are treated as evidence, not arguments.
        </p>

        <h2>Transparency</h2>
        <p>
          Verified submissions may be cited publicly, with identifying details
          redacted when appropriate.
        </p>

        <h2>Non-Retaliation Clause</h2>
        <p>
          Retaliation against red-team contributors undermines the legitimacy of
          any governance claim and is treated as a governance failure.
        </p>

        <h2>Final Clause</h2>
        <p>
          If the Edge cannot survive adversarial scrutiny, it should not exist.
        </p>
      </article>
    </main>
  );
}
