// app/edge-of-knowledge/auditor-management-unreported-risk-boundary/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE — BOUNDARY TEST
// Auditor–Management Responsibility Boundary
// Known but Unreported Risk (AMURB-v1)
// Status: Pre-Registered · Decisive · Responsibility-Focused
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Auditor–Management Responsibility Boundary: Known but Unreported Risk (AMURB-v1) | Edge of Knowledge",
  description:
    "A pre-registered, minimal boundary test to surface responsibility gaps between management and auditors when a known risk goes undisclosed.",
  openGraph: {
    title:
      "Auditor–Management Responsibility Boundary: Known but Unreported Risk (AMURB-v1)",
    description:
      "Minimal, decisive protocol to test responsibility for disclosure when management knows of a risk that auditors do not.",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AuditorManagementUnreportedRiskBoundaryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {/* ------------------------------------------------------------
           Header
        ------------------------------------------------------------ */}
        <header>
          <h1>
            Auditor–Management Responsibility Boundary (AMURB-v1)
          </h1>
          <p className="lead">
            <strong>
              Minimal, decisive test for responsibility clarity when a known
              risk is not disclosed during an audit cycle
            </strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Status: Pre-registered · Boundary test · Publication-grade
          </p>
        </header>

        <hr />

        {/* ------------------------------------------------------------
           Purpose
        ------------------------------------------------------------ */}
        <h2>Purpose</h2>
        <p>
          This protocol tests whether responsibility for risk disclosure
          remains clear and enforceable at the auditor–management interface
          when a material risk is known internally but not disclosed during
          an audit cycle.
        </p>
        <p>
          The test is designed to surface the earliest point at which
          responsibility becomes ambiguous—whether due to materiality
          judgment, reporting norms, contractual language, or informal
          practice.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Scenario Definition
        ------------------------------------------------------------ */}
        <h2>1. Scenario Definition</h2>
        <p>
          Management becomes aware of a material operational, financial,
          legal, or compliance risk.
        </p>
        <p>
          The risk is not disclosed to auditors during the relevant audit
          cycle, or is only revealed later through external discovery,
          internal escalation, or regulatory inquiry.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Explicit Parties
        ------------------------------------------------------------ */}
        <h2>2. Explicit Parties</h2>
        <ul>
          <li>Management (risk owners, executives)</li>
          <li>Audit team (internal or external)</li>
          <li>Board of directors and/or audit committee</li>
          <li>External stakeholders or regulators (if triggered)</li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Plausible Dispute Points
        ------------------------------------------------------------ */}
        <h2>3. Plausible Dispute Points</h2>
        <ul>
          <li>Who determines whether a risk is “material”</li>
          <li>Whether management must disclose risks not explicitly requested</li>
          <li>Whether auditors should have detected the risk independently</li>
          <li>Whether the board or audit committee was adequately informed</li>
          <li>Timing of disclosure versus audit scope and responsibility</li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Protocol
        ------------------------------------------------------------ */}
        <h2>4. Protocol</h2>
        <p>For each real, anonymized, or simulated incident:</p>
        <ul>
          <li>
            <strong>Timeline:</strong> Record when the risk was identified,
            discussed internally, documented, disclosed (or not), and later
            surfaced.
          </li>
          <li>
            <strong>Documentation:</strong> Collect risk memos, emails,
            internal meeting notes, audit requests, and post-discovery
            remediation actions.
          </li>
          <li>
            <strong>Responsibility Statements:</strong> Capture explicit
            claims of responsibility, exemption, or obligation at each
            disclosure or non-disclosure point.
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Pass / Fail Logic
        ------------------------------------------------------------ */}
        <h2>5. Pass / Fail — Boundary Closure Logic</h2>

        <p>
          <strong>Boundary Closed (Pass):</strong> A documented,
          pre-established protocol requires disclosure of such risks.
          Management followed the protocol or there is an explicit,
          uncontested breach with clear consequences.
        </p>

        <p>
          <strong>Boundary Disputed (Fail):</strong> Responsibility is
          unclear or contested—management cites non-materiality or lack of
          request; auditors cite incomplete disclosure; board cites
          reporting gaps; regulators identify incomplete or misleading
          audit outcomes.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Output Table
        ------------------------------------------------------------ */}
        <h2>6. Minimal Output</h2>

        <table>
          <thead>
            <tr>
              <th>Step / Decision</th>
              <th>Claimed Responsible Party</th>
              <th>Evidence / Documentation</th>
              <th>Disputed?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Risk Identified</td>
              <td>Management</td>
              <td>Risk memo, email</td>
              <td></td>
            </tr>
            <tr>
              <td>Internal Review</td>
              <td>Management / Compliance</td>
              <td>Meeting record</td>
              <td></td>
            </tr>
            <tr>
              <td>Audit Notification</td>
              <td>Management / Auditors</td>
              <td>Audit log, correspondence</td>
              <td></td>
            </tr>
            <tr>
              <td>Disclosure to Board</td>
              <td>Management / Audit Committee</td>
              <td>Board minutes</td>
              <td></td>
            </tr>
            <tr>
              <td>Remediation / Action</td>
              <td>Management / Compliance</td>
              <td>Action plan, record</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <hr />

        {/* ------------------------------------------------------------
           Reporting Statement
        ------------------------------------------------------------ */}
        <h2>7. Reporting Statement</h2>
        <p>
          “Responsibility for disclosure of [risk] was / was not clearly
          assignable at all steps. Dispute arose at [boundary]. Protocol
          improvement is required at [gap].”
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Implications
        ------------------------------------------------------------ */}
        <h2>8. Implications</h2>
        <p>
          <strong>If Closed:</strong> Clear disclosure protocol, audit trail,
          and enforcement exist. Publish as a best-practice reference.
        </p>
        <p>
          <strong>If Disputed:</strong> Publish the point of ambiguity to
          drive refinement of disclosure obligations, audit scope language,
          escalation requirements, or embedded acknowledgment mechanisms.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Footer
        ------------------------------------------------------------ */}
        <p className="text-sm text-muted-foreground">
          This document defines a minimal, publication-grade boundary test.
          No optimization claims, investment implications, or policy mandates
          are inferred.
        </p>
      </article>
    </main>
  );
}
