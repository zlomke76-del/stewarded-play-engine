// app/moral-clarity-ai/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moral Clarity AI — Constraint-First Architecture",
  description:
    "Moral Clarity AI (MCAI) is a constraint-first intelligence architecture designed to preserve truth, neutrality, and accountability in high-stakes AI systems.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function MoralClarityAIPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-200">
      {/* Title */}
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-100">
          Moral Clarity AI
        </h1>
        <p className="mt-3 text-base text-neutral-400">
          A Constraint-First Architecture for Reliable Intelligence
        </p>
      </header>

      {/* Overview */}
      <section className="mb-12 space-y-4 text-sm leading-relaxed text-neutral-300">
        <p>
          Artificial intelligence systems most often fail not from a lack of
          capability, but from a lack of constraint. As models grow more
          powerful, the absence of grounded moral architecture, enforceable
          boundaries, and epistemic accountability increases risk in domains
          where consequences are irreversible—governance, medicine, law,
          defense, and public trust.
        </p>
        <p>
          Moral Clarity AI (MCAI) is an intelligence system architecture designed
          to resolve this failure mode. It implements constraint as a
          load-bearing structural property rather than an external policy layer,
          enforcing disciplined reasoning, neutrality under uncertainty, and
          transparent decision boundaries.
        </p>
      </section>

      {/* Section 1 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-medium text-neutral-100">
          1. The Failure Mode of Unconstrained Intelligence
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-300">
          <p>
            As intelligence systems scale, value generation does not increase
            linearly with capability. Instead, risk accelerates when systems are
            allowed to optimize without enforceable moral, epistemic, and
            contextual constraints.
          </p>
          <p>
            This failure mode manifests as persuasive hallucination, implicit
            bias amplification, brittle reasoning under cognitive load, and
            erosion of human agency. In high-stakes environments, these failures
            are not tolerable.
          </p>
          <p>
            MCAI begins from the premise that unconstrained intelligence
            increases systemic risk faster than it generates utility.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-medium text-neutral-100">
          2. Constraint as Load-Bearing Architecture
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-300">
          <p>
            Moral Clarity AI embeds ethics directly into the reasoning substrate
            of the system. Constraints are not advisory; they are structural.
            They govern what may be inferred, how uncertainty is handled, and
            when the system must defer or refuse.
          </p>
          <p>
            This architecture deliberately trades maximal output and engagement
            optimization for reliability, traceability, and alignment with human
            judgment. The system is designed to slow down when stakes rise—not
            accelerate.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-medium text-neutral-100">
          3. Moral Geometry and Epistemic Boundaries
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-300">
          <p>
            MCAI operates within a defined moral geometry: truth preservation,
            neutrality under ambiguity, and stewardship of downstream impact.
            These principles function as invariant constraints across all system
            states.
          </p>
          <p>
            Epistemic boundaries prevent overreach by enforcing explicit limits
            on inference, confidence signaling, and domain authority. When
            information is incomplete or contested, the system surfaces
            uncertainty rather than masking it.
          </p>
        </div>
      </section>

      {/* Section 4 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-medium text-neutral-100">
          4. Human Agency and Accountability
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-neutral-300">
          <p>
            Moral Clarity AI is not designed to replace human judgment. It is
            designed to reinforce it. The system preserves decision authority
            with the human operator while providing structured clarity, bias
            resistance, and reasoning transparency.
          </p>
          <p>
            Every response is produced within inspectable constraints, enabling
            accountability, auditability, and responsible deployment in
            regulated or mission-critical environments.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
        <p>
          © {new Date().getFullYear()} Moral Clarity AI. All rights reserved.
        </p>
        <p className="mt-1">
          Moral Clarity AI™ architecture and related systems are patent pending.
        </p>
      </footer>
    </main>
  );
}
