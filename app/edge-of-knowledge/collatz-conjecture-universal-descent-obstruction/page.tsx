// app/edge-of-knowledge/collatz-conjecture-universal-descent-obstruction/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE
// Collatz Conjecture — Universal Descent Obstruction
// Regime-bounded, non-actionable, non-advisory doctrine
// ============================================================
// This entry exposes an epistemic boundary.
// It does not propose heuristics, proof strategies, or experiments.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Collatz Conjecture: The Universal Descent Obstruction | Edge of Knowledge",
  description:
    "A formal reduction identifying the shared hidden assumption underlying all major approaches to the Collatz (3n+1) Conjecture and the resulting epistemic limitation.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function CollatzUniversalDescentObstructionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          The Collatz Conjecture
          <br />
          and the Universal Descent Obstruction
        </h1>

        <p className="lead">
          <strong>
            This entry isolates the decisive epistemic limitation common to all
            known approaches to the Collatz Conjecture. It does not attempt proof,
            disproof, construction, or methodological guidance.
          </strong>
        </p>

        <p className="text-sm text-red-700 dark:text-red-400">
          <b>Boundary Notice:</b> This material is regime-bounded and
          non-actionable. It is not advice, instruction, or a proposal for
          mathematical research.
        </p>

        <h2>Precise Statement</h2>
        <p>
          Let <code>n</code> be any positive integer. Define a sequence by
          <code>a₀ = n</code> and
        </p>

        <ul>
          <li>
            <code>aₖ₊₁ = aₖ / 2</code> if <code>aₖ</code> is even,
          </li>
          <li>
            <code>aₖ₊₁ = 3aₖ + 1</code> if <code>aₖ</code> is odd.
          </li>
        </ul>

        <p>
          The Collatz Conjecture asserts that for every starting integer{" "}
          <code>n &gt; 0</code>, the sequence eventually reaches{" "}
          <code>1</code>.
        </p>

        <h2>Scope</h2>
        <p>
          The conjecture applies to all positive integers. The iteration is
          deterministic, discrete, and defined entirely within elementary
          arithmetic.
        </p>

        <h2>Dominant Historical Strategy Classes</h2>
        <ul>
          <li>
            <strong>Computational Search:</strong> exhaustive verification up to
            extremely large finite bounds.
          </li>
          <li>
            <strong>Probabilistic and Statistical Models:</strong> treating
            trajectories as random or average processes to estimate decay.
          </li>
          <li>
            <strong>Modular and Arithmetic Progression Analysis:</strong> studying
            behavior within residue classes or nested congruences.
          </li>
          <li>
            <strong>Dynamical Systems and Ergodic Theory:</strong> interpreting
            the iteration as a discrete dynamical system and analyzing orbit
            structure.
          </li>
        </ul>

        <h2>Core Hidden Assumption</h2>
        <p>
          All major approaches implicitly assume that every trajectory is
          ultimately constrained by a mechanism that forces descent to{" "}
          <code>1</code>.
        </p>

        <p>
          Specifically, it is assumed that no positive integer yields an orbit
          that escapes to infinity or enters a nontrivial infinite cycle.
        </p>

        <h2>Why This Assumption Limits Progress</h2>
        <p>
          No method has identified a structural reason guaranteeing universal
          descent. Existing arguments rely on expectation, density, or average
          behavior rather than exhaustive necessity.
        </p>

        <ul>
          <li>
            Probabilistic decay does not preclude rare, exceptional trajectories.
          </li>
          <li>
            Finite computation cannot rule out divergence beyond checked bounds.
          </li>
          <li>
            Modular analyses fragment behavior without establishing global
            convergence.
          </li>
          <li>
            No invariant or monotonic quantity is known to decrease along every
            orbit.
          </li>
        </ul>

        <p>
          As a result, the conjecture may be true while remaining inaccessible to
          proof under current paradigms.
        </p>

        <h2>Falsifiable Constraint</h2>
        <p>
          Any genuine resolution of the Collatz Conjecture must satisfy one of
          the following:
        </p>

        <ul>
          <li>
            <strong>Proof:</strong> exhibit a universal, rigorous descent
            mechanism that blocks both infinite growth and nontrivial cycles for
            all starting values.
          </li>
          <li>
            <strong>Counterexample:</strong> provide an explicit starting value
            whose trajectory provably never reaches <code>1</code>, either by
            divergence or by entry into a nontrivial loop.
          </li>
        </ul>

        <p>
          In either case, the result must be independently verifiable and not
          rely on probabilistic expectation or finite computation.
        </p>

        <h2>Non-Conclusions</h2>
        <ul>
          <li>The conjecture is neither proved nor disproved.</li>
          <li>
            Verification up to large bounds does not establish universality.
          </li>
          <li>
            Statistical decay arguments do not exclude exceptional behavior.
          </li>
          <li>
            Absence of known divergent orbits is not evidence of nonexistence.
          </li>
        </ul>

        <h2>Canonical Classification</h2>
        <p>
          This entry is an <strong>Edge of Knowledge</strong> artifact. It
          delineates an epistemic boundary without proposing actions, methods, or
          applications.
        </p>

        <hr />

        <p className="text-sm text-neutral-400">
          Canonical · Public · Regime-bounded · Version 1.0
          <br />
          Updates require explicit revision. Silent modification invalidates the
          entry.
        </p>
      </article>
    </main>
  );
}
