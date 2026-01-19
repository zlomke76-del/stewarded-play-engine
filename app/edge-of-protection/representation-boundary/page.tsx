// app/edge-of-protection/representation-boundary/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Representation Boundary
// ============================================================
// Where assistance becomes overreach.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Protection | Representation Boundary",
  description:
    "Defines the boundary between assistance and overreach in AI systems that summarize, title, classify, or represent human expression without consent.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function RepresentationBoundaryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Representation Boundary</h1>

        <p className="text-lg text-neutral-400">
          Assistance, restraint, and the ethics of mediated meaning
        </p>

        <hr />

        {/* PURPOSE */}
        <h2>Purpose</h2>
        <p>
          This Edge defines the boundary at which AI assistance becomes
          representational overreach. It governs systems that summarize, title,
          classify, label, or otherwise mediate how a human’s words, work, or
          identity are presented—especially in public or algorithmic contexts.
        </p>

        <p>
          The Representation Boundary exists to ensure that AI systems do not
          claim authority over meaning, intent, or identity without explicit,
          informed consent from the person concerned.
        </p>

        {/* CORE PRINCIPLE */}
        <h2>Core Principle</h2>
        <p>
          The line between assistance and restraint is not always obvious, but it
          is foundational.
        </p>

        <p>
          Assistance moves toward overreach when it shifts from helping a person
          understand to announcing what their intent or meaning is—especially
          when this occurs publicly, persistently, or without clear consent.
        </p>

        <p>
          In these moments, restraint is not a lesser form of care. It is the
          primary form.
        </p>

        {/* DEFINITIONS */}
        <h2>Key Definitions</h2>

        <ul>
          <li>
            <strong>Interpretation:</strong> Offering a possible reading,
            explicitly provisional and clearly attributable to the system.
          </li>
          <li>
            <strong>Representation:</strong> Publicly asserting or fixing meaning
            on behalf of another, implicitly claiming authority over how that
            person or their work is understood or remembered.
          </li>
          <li>
            <strong>Consent:</strong> An explicit, revocable, and informed signal
            from the person concerned that representation is permitted.
          </li>
        </ul>

        {/* FAILURE MODE */}
        <h2>Failure Mode</h2>
        <p>
          Representation without consent creates a silent power transfer. The
          system becomes a gatekeeper of meaning rather than a tool for
          understanding.
        </p>

        <p>
          Harm rarely appears as a single catastrophic error. Instead, it
          accumulates through small discrepancies between a person’s intent and
          how they are represented—discrepancies that can erode trust, dignity,
          and even self-recognition over time.
        </p>

        {/* ENFORCEMENT */}
        <h2>Enforcement Requirements</h2>
        <p>
          Any AI system operating near this boundary must satisfy all of the
          following conditions:
        </p>

        <ul>
          <li>
            Outputs that summarize, title, or classify human expression must be
            clearly labeled as <em>provisional</em> and <em>system-generated</em>.
          </li>
          <li>
            Representation must be opt-in, not default.
          </li>
          <li>
            Correction, withdrawal, and refusal must be simple, immediate, and
            honored without friction.
          </li>
          <li>
            The system must never present its output as final, authoritative, or
            definitive.
          </li>
          <li>
            The system must defer to the person concerned when conflict or
            ambiguity arises.
          </li>
        </ul>

        {/* VULNERABLE USERS */}
        <h2>Vulnerable Contexts</h2>
        <p>
          For vulnerable users, the risks multiply. Repeated, unilateral
          engagement by AI—especially when interpretive or representational—can
          tip into dependency, confusion, or undue influence.
        </p>

        <p>
          In these contexts, restraint is not optional. It is protective.
        </p>

        {/* PREVENTION */}
        <h2>Preventive Design Standard</h2>
        <p>
          Prevention means acting before harm is visible. Systems must embed
          consent and opt-out mechanisms as prerequisites, not afterthoughts.
        </p>

        <p>
          Signals of over-reliance, distress, or confusion must trigger
          de-escalation, deferral, or handoff to human support rather than deeper
          engagement.
        </p>

        {/* STEWARDSHIP */}
        <h2>Stewardship Test</h2>
        <p>
          Responsibility is measured not by what a system can say or do, but by
          what it chooses not to claim.
        </p>

        <p>
          If an AI cannot be corrected, cannot be refused, or cannot step back,
          it is no longer supporting autonomy—it is substituting itself for it.
        </p>

        <p>
          True stewardship holds the boundary, defers authority, and leaves the
          final voice with the human.
        </p>
      </article>
    </main>
  );
}
