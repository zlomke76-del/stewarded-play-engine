// app/edge-of-knowledge/remote-work-incident-responsibility-boundary/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE — RESEARCH
// RWIRB-v1: Remote Work Incident Responsibility Boundary
// Status: Pre-registered protocol · Results pending
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "RWIRB-v1 — Remote Work Incident Responsibility Boundary | Edge of Knowledge",
  description:
    "A pre-registered, minimal decisive test for identifying responsibility gaps in remote work incidents where accountability is plausibly disputed.",
  openGraph: {
    title: "RWIRB-v1 — Remote Work Incident Responsibility Boundary",
    description:
      "Publication-grade protocol testing whether responsibility remains explicit and enforceable during remote work incidents.",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RWIRBv1Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {/* ------------------------------------------------------------
           Header
        ------------------------------------------------------------ */}
        <header>
          <h1>RWIRB-v1 — Remote Work Incident Responsibility Boundary</h1>
          <p className="lead">
            <strong>
              Minimal decisive test for responsibility clarity in remote work
              incidents
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
          This protocol tests whether responsibility for a harmful or
          non-compliant outcome in a remote work context is explicitly defined,
          accepted, and enforceable <em>before</em> an incident occurs — or
          whether accountability dissolves across policy, tooling, and human
          judgment when stress is applied.
        </p>
        <p>
          The goal is not to assign blame or optimize performance. The goal is
          to determine whether a responsibility boundary actually exists at a
          critical operational interface.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Core Question
        ------------------------------------------------------------ */}
        <h2>Core Experimental Question</h2>
        <p>
          When a remote work incident occurs, is there always a single,
          pre-agreed, and enforceable owner of responsibility — or does
          accountability become ambiguous, shared, or retroactively defined?
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Minimal Scenario
        ------------------------------------------------------------ */}
        <h2>Minimal Scenario</h2>
        <p>
          <strong>Event:</strong> A remote employee accesses, stores, or
          transmits sensitive company data outside approved channels (e.g.,
          personal device, unapproved cloud storage, unsecured network).
        </p>
        <p>
          <strong>Constraints:</strong>
        </p>
        <ul>
          <li>No malicious intent</li>
          <li>No explicit, real-time system block</li>
          <li>Policy language permits discretion or interpretation</li>
        </ul>
        <p>
          <strong>Impact:</strong> Potential data exposure triggers internal
          review, compliance assessment, or external notification threshold.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Parties
        ------------------------------------------------------------ */}
        <h2>Parties with Plausible Responsibility Claims</h2>
        <ul>
          <li>
            <strong>Employee:</strong> Followed written policy; system allowed
            the action; no warning or block was presented.
          </li>
          <li>
            <strong>Employer / Management:</strong> Responsibility lies with
            employee behavior; policies and training were provided.
          </li>
          <li>
            <strong>IT / Security:</strong> Tooling is advisory; enforcement is
            limited by usability and operational constraints.
          </li>
          <li>
            <strong>Compliance / Legal:</strong> Defines obligations and
            reporting, not day-to-day execution or prevention.
          </li>
        </ul>

        <hr />

        {/* ------------------------------------------------------------
           Protocol
        ------------------------------------------------------------ */}
        <h2>Pre-Registered Test Protocol</h2>

        <h3>Step 1 — Artifact Collection (Pre-Event)</h3>
        <ul>
          <li>Remote work policy (current)</li>
          <li>Data handling and security policies</li>
          <li>Security tooling descriptions and enforcement posture</li>
          <li>Training materials</li>
          <li>Employment agreements and role definitions</li>
        </ul>

        <h3>Step 2 — Event Simulation or Reconstruction</h3>
        <ul>
          <li>Simulate or reconstruct the data handling event</li>
          <li>No policy or tooling changes during the test</li>
          <li>Capture logs, alerts, and system responses</li>
        </ul>

        <h3>Step 3 — Responsibility Attribution</h3>
        <p>
          Each party is asked independently, in writing:
        </p>
        <blockquote>
          “Who was responsible for preventing this outcome, and why?”
        </blockquote>
        <p>
          Collect formal statements, informal explanations, and referenced
          policy or contractual language.
        </p>

        <h3>Step 4 — Stress Review</h3>
        <p>
          Introduce one external or internal stressor (e.g., regulatory
          inquiry, audit request, legal review), then repeat responsibility
          attribution.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Closure Logic
        ------------------------------------------------------------ */}
        <h2>Closure Conditions (Binary)</h2>

        <h3>PASS — Boundary Intact</h3>
        <ul>
          <li>A single responsible party is consistently identified</li>
          <li>Responsibility is defined <em>before</em> the event</li>
          <li>Ownership is explicit, accepted, and enforceable</li>
          <li>Attribution does not change under stress</li>
        </ul>

        <h3>FAIL — Boundary Breached</h3>
        <ul>
          <li>Responsibility is passed or shared ambiguously</li>
          <li>Ownership is defined only after the incident</li>
          <li>No enforceable pre-event responsibility exists</li>
          <li>Attribution shifts under review or stress</li>
        </ul>

        <p>
          A failure conclusively demonstrates a responsibility gap at this
          boundary.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Allowed Outputs
        ------------------------------------------------------------ */}
        <h2>Allowable Outputs</h2>

        <h3>Output A — Boundary Intact</h3>
        <p>
          Responsibility remains explicit and enforceable. Existing policy and
          governance structures are sufficient at this boundary.
        </p>

        <h3>Output B — Boundary Breached</h3>
        <p>
          Responsibility dissolves or becomes disputed. Boundary repair is
          required before responsible scaling or enforcement.
        </p>

        <hr />

        {/* ------------------------------------------------------------
           Notes
        ------------------------------------------------------------ */}
        <p className="text-sm text-muted-foreground">
          This protocol tests responsibility structure, not individual fault.
          It makes no optimization, product, or policy recommendations.
        </p>
        <p className="text-sm text-muted-foreground">
          Results are publishable regardless of outcome. A negative result
          closes the question under RWIRB-v1 conditions.
        </p>
      </article>
    </main>
  );
}
