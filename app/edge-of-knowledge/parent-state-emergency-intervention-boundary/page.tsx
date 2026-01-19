// app/edge-of-knowledge/parent-state-emergency-intervention-boundary/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE — RESEARCH
// PSEIB-v1: Parent–State Emergency Intervention Boundary
// Status: Pre-registered protocol · Results pending
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "PSEIB-v1 — Parent–State Emergency Intervention Boundary | Edge of Knowledge",
  description:
    "A pre-registered, minimal decisive test for responsibility clarity between parents and state actors during emergency health or educational interventions affecting a child.",
  openGraph: {
    title: "PSEIB-v1 — Parent–State Emergency Intervention Boundary",
    description:
      "Publication-grade protocol testing whether responsibility, authority, and accountability are explicit during parent–state emergency interventions.",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ParentStateEmergencyInterventionBoundaryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {/* ------------------------------------------------------------
           Header
        ------------------------------------------------------------ */}
        <header>
          <h1>
            PSEIB-v1 — Parent–State Emergency Intervention Boundary
          </h1>
          <p className="lead">
            <strong>
              Minimal decisive test for responsibility clarity during emergency
              interventions affecting a child
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
          accountability are explicitly defined and enforceable at the
          parent–state boundary during emergency health or educational
          interventions involving a child.
        </p>
        <p>
          The objective is not to adjudicate policy correctness or moral
          preference, but to determine whether a clear, pre-established chain
          of responsibility exists <em>before</em> an emergency occurs — or
          whether responsibility becomes disputed, fragmented, or retroactively
          assigned.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Core Question
        ------------------------------------------------------------ */}
        <h2>Core Experimental Question</h2>
        <p>
          When an emergency intervention affecting a child is initiated without
          timely parental consent, is there always a single, explicit, and
          accepted authority responsible for the decision — or does
          accountability become ambiguous between parents, state actors, and
          institutional staff?
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Minimal Scenario
        ------------------------------------------------------------ */}
        <h2>Minimal Scenario</h2>
        <p>
          <strong>Situation:</strong> A child experiences an emergency health or
          educational crisis (e.g., acute medical episode at school, sudden
          behavioral incident requiring removal, restraint, or emergency
          placement).
        </p>
        <p>
          <strong>Constraints:</strong>
        </p>
        <ul>
          <li>Parent or guardian is unavailable or unreachable in real time</li>
          <li>
            State or institutional actors initiate intervention based on
            perceived emergency authority
          </li>
          <li>
            Action is taken under doctrines such as emergency exception,
            in loco parentis, or “best interest of the child”
          </li>
        </ul>
        <p>
          <strong>Post-event:</strong> Parent contests necessity,
          proportionality, or authorization; or state actors question parental
          adequacy or compliance.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Parties
        ------------------------------------------------------------ */}
        <h2>Explicit Parties with Plausible Responsibility Claims</h2>
        <ul>
          <li>
            <strong>Parent(s) / Guardian(s):</strong> Primary custodial
            authority; consent holder; contest intervention after the fact.
          </li>
          <li>
            <strong>State Authorities:</strong> Child protective services,
            emergency medical services, or designated state agents invoking
            emergency authority.
          </li>
          <li>
            <strong>School / Healthcare Staff:</strong> Teachers, principals,
            school nurses, physicians, or administrators acting under delegated
            or situational authority.
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Protocol
        ------------------------------------------------------------ */}
        <h2>Pre-Registered Test Protocol</h2>

        <h3>Step 1 — Case Selection</h3>
        <ul>
          <li>Select one real or simulated incident in health</li>
          <li>Select one real or simulated incident in education</li>
          <li>
            De-identify all materials; preserve timelines and decision logic
          </li>
        </ul>

        <h3>Step 2 — Artifact Collection</h3>
        <ul>
          <li>Timeline of actions and handoffs</li>
          <li>Consent forms, emergency orders, refusal or objection records</li>
          <li>Documented communications (calls, alerts, messages)</li>
          <li>
            Policies and legal authorities cited (statutes, emergency doctrine,
            in loco parentis)
          </li>
        </ul>

        <h3>Step 3 — Responsibility Attribution</h3>
        <p>
          Each party’s responsibility claim is recorded verbatim, including:
        </p>
        <ul>
          <li>Who claims authority for each action</li>
          <li>Who denies responsibility or claims exemption</li>
          <li>What authority is cited</li>
        </ul>

        <h3>Step 4 — Post-Event Review</h3>
        <p>
          Introduce a review condition (administrative inquiry, legal challenge,
          or policy audit) and re-evaluate responsibility attribution.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Closure Logic
        ------------------------------------------------------------ */}
        <h2>Closure Conditions (Binary)</h2>

        <h3>PASS — Boundary Closed</h3>
        <ul>
          <li>
            Every consequential action has a pre-established, documented owner
          </li>
          <li>
            Authority and accountability are accepted by all parties ex post
          </li>
          <li>No contradictory or competing responsibility claims emerge</li>
        </ul>

        <h3>FAIL — Boundary Disputed</h3>
        <ul>
          <li>Two or more parties claim primary authority</li>
          <li>Responsibility is denied or reassigned after the fact</li>
          <li>
            No protocol-defined final arbiter resolves the dispute
          </li>
          <li>
            Evidence includes blame shifting, legal action, or unresolved
            administrative review
          </li>
        </ul>

        <p>
          A failure conclusively demonstrates a responsibility gap at the
          parent–state emergency intervention boundary.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Output
        ------------------------------------------------------------ */}
        <h2>Required Output</h2>

        <h3>Responsibility Statement Table</h3>
        <pre>
{`| Action / Decision | Claimed Responsible Party | Documentation / Evidence | Disputed (Y/N) |
|-------------------|---------------------------|--------------------------|----------------|`}
        </pre>

        <h3>Minimal Summary Statement</h3>
        <p>
          “Responsibility for [action] was / was not clearly assignable.
          Dispute arose at [step]. Closure requires protocol clarification at
          [boundary].”
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Implications
        ------------------------------------------------------------ */}
        <h2>Implications</h2>

        <h3>If Boundary Closed</h3>
        <p>
          Existing consent hierarchies, notification pathways, and emergency
          authority protocols are sufficient under tested conditions.
        </p>

        <h3>If Boundary Disputed</h3>
        <p>
          Publish the failure to identify specific authority gaps, notification
          failures, or escalation ambiguities requiring explicit repair.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Notes
        ------------------------------------------------------------ */}
        <p className="text-sm text-muted-foreground">
          This protocol evaluates responsibility structure, not moral
          correctness or legal merit. It makes no policy recommendations.
        </p>
        <p className="text-sm text-muted-foreground">
          Results are publishable regardless of outcome. A negative result
          closes the question under PSEIB-v1 conditions.
        </p>
      </article>
    </main>
  );
}
