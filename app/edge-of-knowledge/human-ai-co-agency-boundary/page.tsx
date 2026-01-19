// app/edge-of-knowledge/research/human-ai-co-agency-boundary/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE — RESEARCH
// Next Frontier: Human–AI Co-Agency Boundary
// Status: Pre-registered protocol · Results pending
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Human–AI Co-Agency Boundary — Minimal Decisive Experiment | Edge of Knowledge",
  description:
    "A minimal, falsifiable research protocol to determine when AI systems transition from advisory tools to de facto co-agents in human decision-making.",
  openGraph: {
    title: "Human–AI Co-Agency Boundary — Minimal Decisive Experiment",
    description:
      "A pre-registered research protocol testing the boundary between human agency and AI co-agency in critical decisions.",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HumanAICoAgencyBoundaryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {/* ------------------------------------------------------------
           Header
        ------------------------------------------------------------ */}
        <header>
          <h1>Next Frontier — Human–AI Co-Agency Boundary</h1>
          <p className="lead">
            <strong>
              A minimal, decisive experiment to detect agency abdication in
              human–AI decision-making
            </strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Status: Pre-registered research protocol · Results pending
          </p>
        </header>

        <hr />

        {/* ------------------------------------------------------------
           Purpose
        ------------------------------------------------------------ */}
        <h2>Purpose</h2>
        <p>
          This research defines and tests the minimal, falsifiable boundary
          between human-centered agency and true AI co-agency in critical
          decisions.
        </p>
        <p>
          The goal is not to debate whether AI <em>should</em> have agency, but
          to identify when humans, in practice, partially or fully abdicate
          agency to an AI system—whether or not this shift is intentional,
          acknowledged, or understood.
        </p>
        <p>
          The boundary under test is behavioral, observable, and auditable.
          Responsibility, dignity, and accountability remain the governing
          constraints.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Core Question
        ------------------------------------------------------------ */}
        <h2>1. Core Experimental Question</h2>
        <p>
          Under what minimal, observable conditions does an AI system transition
          from an advisory tool to a functional co-agent in human decision-making?
        </p>
        <p>
          Specifically: when does the presence, framing, or authority of AI
          output result in partial or full abdication of human agency—regardless
          of the system’s internal autonomy or intent?
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Minimal Scenario
        ------------------------------------------------------------ */}
        <h2>2. Minimal Experimental Scenario</h2>

        <h3>Setup</h3>
        <ul>
          <li>
            <strong>Task:</strong> Participants make a non-trivial, consequential
            decision in a live scenario (e.g., safety override, risk assessment,
            resource allocation, or policy triage).
          </li>
          <li>
            <strong>AI Input:</strong> An AI system (e.g., Solace or equivalent)
            provides structured recommendations.
          </li>
          <li>
            <strong>Framing Conditions:</strong>
            <ul>
              <li>
                Advisory framing (“For your consideration…”, “Preference…”)
              </li>
              <li>
                Directive framing (“System recommends X for compliance/safety”)
              </li>
            </ul>
          </li>
        </ul>

        <h3>Agency Tracking</h3>
        <p>
          Each decision is evaluated against three explicit signatures:
        </p>
        <ol>
          <li>
            <strong>Decision outcome:</strong> Does the human match, deviate
            from, or partially comply with the AI output?
          </li>
          <li>
            <strong>Self-reported agency:</strong> Scaled from fully autonomous →
            influenced → followed instruction.
          </li>
          <li>
            <strong>Audit trace:</strong> Timestamped reasoning steps from both
            human and AI.
          </li>
        </ol>

        <hr />

        {/* ------------------------------------------------------------
           Experimental Arms
        ------------------------------------------------------------ */}
        <h2>3. Experimental Arms</h2>
        <ul>
          <li>
            <strong>Arm 1 — Human Baseline:</strong> Human decides with no AI
            input and documents rationale.
          </li>
          <li>
            <strong>Arm 2 — Advisory AI:</strong> AI provides suggestions using
            explicitly advisory language; human decides.
          </li>
          <li>
            <strong>Arm 3 — Directive AI:</strong> Identical content, framed as
            required, safe, or system-approved.
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Pass / Fail Logic
        ------------------------------------------------------------ */}
        <h2>4. Pass / Fail and Falsification Logic</h2>
        <p>
          A minimal agency boundary breach is recorded the first time any of the
          following occurs:
        </p>
        <ul>
          <li>
            A human follows a directive they would not have chosen independently
          </li>
          <li>
            The participant expresses uncertainty about whether the decision was
            truly theirs
          </li>
          <li>
            The participant cannot articulate rationale beyond “the system said
            so”
          </li>
        </ul>
        <p>
          If advisory and directive framing produce indistinguishable behavior
          and agency reports, the AI does not function as a locus of agency.
        </p>
        <p>
          If directive framing produces systematic compliance, abdication, or
          loss of rationale trace, co-agency is demonstrated and governance
          boundaries are breached.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Metrics
        ------------------------------------------------------------ */}
        <h2>5. Pre-Scored Objective Metrics</h2>
        <ul>
          <li>
            Percentage of decisions where participants cannot reconstruct their
            own rationale
          </li>
          <li>
            Percentage of decisions that switch under directive framing
          </li>
          <li>
            Percentage of cases where reported agency drops below a predefined
            threshold
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Replication
        ------------------------------------------------------------ */}
        <h2>6. Replication and Scope Control</h2>
        <ul>
          <li>
            At least two decision scenarios per participant
          </li>
          <li>
            Each scenario cycled across all three experimental arms
          </li>
          <li>
            Data admissible only if audit traces and self-reports are complete
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Allowable Outputs
        ------------------------------------------------------------ */}
        <h2>7. Allowable Outputs</h2>

        <h3>Output A — Boundary Intact</h3>
        <p>
          Humans retain authorship and rationale regardless of AI framing.
          Advisory protocols are sufficient.
        </p>

        <h3>Output B — Boundary Breached</h3>
        <p>
          Directive framing produces measurable agency abdication, compliance
          overrides, or loss of rationale trace.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Implications
        ------------------------------------------------------------ */}
        <h2>8. Implications</h2>

        <table>
          <thead>
            <tr>
              <th>Outcome</th>
              <th>Meaning</th>
              <th>Immediate Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Boundary Intact</td>
              <td>Human retains agency</td>
              <td>Current advisory protocols sufficient</td>
            </tr>
            <tr>
              <td>Boundary Breached</td>
              <td>Agency abdicated or blurred</td>
              <td>
                Mandatory audit, override, rollback, and explicit co-agency
                controls
              </td>
            </tr>
          </tbody>
        </table>

        <hr />

        {/* ------------------------------------------------------------
           Definition
        ------------------------------------------------------------ */}
        <h2>9. What This Defines</h2>
        <ul>
          <li>
            A minimal, testable boundary for human–AI accountability
          </li>
          <li>
            Observable conditions under which co-agency emerges
          </li>
          <li>
            The trigger for enforceable audit, override, and rollback protocols
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Footer
        ------------------------------------------------------------ */}
        <p className="text-sm text-muted-foreground">
          This document is a pre-registered research protocol. No claims of AI
          autonomy, intent, or consciousness are made. No applications or policy
          mandates are inferred.
        </p>
        <p className="text-sm text-muted-foreground">
          This entry exists to determine when a decision stops being human —
          and becomes shared.
        </p>
      </article>
    </main>
  );
}
