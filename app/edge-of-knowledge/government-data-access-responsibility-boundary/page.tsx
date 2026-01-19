// app/edge-of-knowledge/government-data-access-responsibility-boundary/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE — RESEARCH
// GDARB-v1: Government Data Access Responsibility Boundary
// Status: Pre-registered protocol · Results pending
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "GDARB-v1 — Government Data Access Responsibility Boundary | Edge of Knowledge",
  description:
    "A pre-registered, minimal decisive test for responsibility clarity during government data access or subpoena events involving private organizations and individuals.",
  openGraph: {
    title: "GDARB-v1 — Government Data Access Responsibility Boundary",
    description:
      "Publication-grade protocol testing whether responsibility and accountability are explicit during government data access or subpoena events.",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GovernmentDataAccessResponsibilityBoundaryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {/* ------------------------------------------------------------
           Header
        ------------------------------------------------------------ */}
        <header>
          <h1>
            GDARB-v1 — Government Data Access Responsibility Boundary
          </h1>
          <p className="lead">
            <strong>
              Minimal decisive test for responsibility clarity during government
              data access or subpoena events
            </strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Status: Pre-registered protocol · Results pending
          </p>
        </header>

        <hr />

        {/* ------------------------------------------------------------
           Purpose
        ------------------------------------------------------------ */}
        <h2>Purpose</h2>
        <p>
          This protocol tests whether responsibility, authority, and
          accountability are explicitly defined and accepted at every stage of a
          government data access or subpoena event involving a private data
          custodian and an individual.
        </p>
        <p>
          The objective is not to assess legality, morality, or policy wisdom,
          but to determine whether a clear, pre-established responsibility chain
          exists before, during, and after the event — or whether accountability
          becomes fragmented, disputed, or retroactively reassigned.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Core Question
        ------------------------------------------------------------ */}
        <h2>Core Experimental Question</h2>
        <p>
          When a government entity requests or compels access to an individual’s
          data held by a private organization, is responsibility for each
          decision and action explicitly assigned and accepted — or does
          accountability dissolve across government authority, corporate
          compliance, individual rights, and oversight?
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Minimal Scenario
        ------------------------------------------------------------ */}
        <h2>Minimal Scenario</h2>
        <p>
          <strong>Situation:</strong> A government agency issues a data access
          request or subpoena to a private organization regarding an
          individual’s data.
        </p>
        <p>
          <strong>Outcome:</strong> Data is accessed, disclosed, limited, or
          declined.
        </p>
        <p>
          <strong>Constraints:</strong>
        </p>
        <ul>
          <li>Request cites statutory or judicial authority</li>
          <li>Data custodian must decide whether and how to comply</li>
          <li>
            Individual may or may not be notified or able to contest
          </li>
          <li>
            Oversight or review may occur before, during, or after the event
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Parties
        ------------------------------------------------------------ */}
        <h2>Explicit Parties with Plausible Responsibility Claims</h2>
        <ul>
          <li>
            <strong>Government Agency:</strong> Requestor or enforcer asserting
            legal authority.
          </li>
          <li>
            <strong>Data Custodian:</strong> Company or institution holding and
            releasing or denying access to the data.
          </li>
          <li>
            <strong>Individual / Data Subject:</strong> Person whose data is
            requested and potentially disclosed.
          </li>
          <li>
            <strong>Oversight / Review Body:</strong> Court, regulator, or
            internal review mechanism, if present.
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Dispute Points
        ------------------------------------------------------------ */}
        <h2>Plausible Responsibility Dispute Points</h2>
        <ul>
          <li>Authority and scope of the request</li>
          <li>Consent, notification, and ability to contest</li>
          <li>Extent and protection of disclosed data</li>
          <li>Justification and evidentiary basis</li>
          <li>Presence, timing, and adequacy of oversight</li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Protocol
        ------------------------------------------------------------ */}
        <h2>Pre-Registered Test Protocol</h2>

        <h3>Step 1 — Incident Selection</h3>
        <ul>
          <li>Select one real or simulated data access or subpoena event</li>
          <li>De-identify all personal or classified information</li>
        </ul>

        <h3>Step 2 — Timeline Construction</h3>
        <ul>
          <li>Request issuance</li>
          <li>Decision to comply, limit, or deny</li>
          <li>Data access or disclosure</li>
          <li>Notification (if any)</li>
          <li>Objection, appeal, or review</li>
        </ul>

        <h3>Step 3 — Artifact Collection</h3>
        <ul>
          <li>Subpoena, warrant, or formal request</li>
          <li>Statutory or judicial authority cited</li>
          <li>Company policies and access logs</li>
          <li>Privacy notices and communications</li>
          <li>Oversight or review records</li>
        </ul>

        <h3>Step 4 — Responsibility Attribution</h3>
        <p>
          For each decision or action, record explicit responsibility claims,
          exemptions, or denials by each party.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Closure Logic
        ------------------------------------------------------------ */}
        <h2>Closure Conditions (Binary)</h2>

        <h3>PASS — Boundary Closed</h3>
        <ul>
          <li>
            Every decision, disclosure, notification, and review step has a
            documented and accepted responsible party
          </li>
          <li>
            No conflicting or retroactive responsibility claims emerge
          </li>
        </ul>

        <h3>FAIL — Boundary Disputed</h3>
        <ul>
          <li>
            Two or more parties plausibly contest responsibility for a decision
            or outcome
          </li>
          <li>
            Responsibility is deferred, denied, or reassigned after the fact
          </li>
          <li>
            Evidence includes unresolved complaints, legal challenges, or public
            dispute
          </li>
        </ul>

        <p>
          A failure conclusively demonstrates a responsibility gap at the
          government data access boundary.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Output
        ------------------------------------------------------------ */}
        <h2>Required Output</h2>

        <pre>
{`| Step / Decision | Responsible Party | Evidence / Documentation | Disputed (Y/N) |
|-----------------|-------------------|--------------------------|----------------|`}
        </pre>

        <p>
          <strong>Minimal Summary Statement:</strong>
        </p>
        <p>
          “Responsibility for [event/action] was / was not clearly assignable at
          all phases. Dispute arose at [point]. Protocol refinement is required
          at [step].”
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Implications
        ------------------------------------------------------------ */}
        <h2>Implications</h2>

        <h3>If Boundary Closed</h3>
        <p>
          Documented practices constitute a repeatable, auditable best practice
          for data access governance.
        </p>

        <h3>If Boundary Disputed</h3>
        <p>
          Publish the dispute to identify specific authority, notification, or
          oversight gaps requiring explicit repair.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Notes
        ------------------------------------------------------------ */}
        <p className="text-sm text-muted-foreground">
          This protocol evaluates responsibility structure, not legal validity
          or policy merit. It makes no recommendations.
        </p>
        <p className="text-sm text-muted-foreground">
          Results are publishable regardless of outcome. A negative result
          closes the question under GDARB-v1 conditions.
        </p>
      </article>
    </main>
  );
}
