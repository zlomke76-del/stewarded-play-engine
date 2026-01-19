// app/edge-of-knowledge/birch-and-swinnerton-dyer-sha-obstruction/page.tsx
// ============================================================
// EDGE OF KNOWLEDGE
// Birch and Swinnerton-Dyer Conjecture — Sha Obstruction
// Regime-bounded, non-actionable, non-advisory doctrine
// ============================================================
// This entry exposes a structural epistemic boundary.
// It does not propose methods, strategies, or solutions.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Birch and Swinnerton-Dyer: The Shafarevich–Tate Obstruction | Edge of Knowledge",
  description:
    "A formal reduction showing why the Birch and Swinnerton-Dyer conjecture is structurally blocked without control of the Shafarevich–Tate group.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function BSDShaObstructionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          Birch and Swinnerton-Dyer Conjecture:
          <br />
          The Shafarevich–Tate Obstruction
        </h1>

        <p className="lead">
          <strong>
            This entry identifies the decisive epistemic barrier in the full
            Birch and Swinnerton-Dyer conjecture. It does not attempt resolution,
            construction, or recommendation.
          </strong>
        </p>

        <p className="text-sm text-red-700 dark:text-red-400">
          <b>Boundary Notice:</b> This material is regime-bounded and
          non-actionable. It is not advice, instruction, or a proposal for
          mathematical research direction.
        </p>

        <h2>Statement of the Problem</h2>
        <p>
          The Birch and Swinnerton-Dyer conjecture asserts a precise identity
          relating the leading Taylor coefficient of the L-function of an
          elliptic curve over ℚ at <code>s = 1</code> to arithmetic invariants of
          the curve.
        </p>

        <p>
          In its full form, the conjecture is not merely an equality between
          algebraic rank and analytic order of vanishing, but an explicit
          arithmetic formula whose validity depends on the behavior of multiple
          invariants.
        </p>

        <h2>The Full Leading-Term Formula</h2>
        <p>
          For an elliptic curve <code>E/ℚ</code> of rank <code>r</code>, the
          conjecture asserts:
        </p>

        <pre>
{`lim_{s→1} L(E,s)/(s−1)^r
= ( |Sha(E)| · Ω_E · Reg_E · ∏ c_p ) / |E(ℚ)_tors|²`}
        </pre>

        <p>
          Among these terms, the Shafarevich–Tate group <code>Sha(E)</code> plays
          a structurally unique role.
        </p>

        <h2>Core Hidden Assumption</h2>
        <p>
          All known approaches to the conjecture—analytic, arithmetic, or
          Iwasawa-theoretic—depend essentially on the unproven assumption that:
        </p>

        <ul>
          <li>
            The Shafarevich–Tate group <code>Sha(E)</code> is finite, and
          </li>
          <li>
            Its arithmetic structure does not introduce independent complexity
            that obstructs effective comparison between analytic and algebraic
            invariants.
          </li>
        </ul>

        <p>
          This assumption is not auxiliary. The order of{" "}
          <code>Sha(E)</code> appears explicitly in the conjectured identity.
        </p>

        <h2>Why This Is a Structural Obstruction</h2>
        <p>
          Where <code>Sha(E)</code> is controlled—such as certain rank 0 or rank 1
          cases via Euler systems—the conjecture becomes accessible.
        </p>

        <p>
          Outside these regimes, no unconditional framework exists to:
        </p>

        <ul>
          <li>Compute or bound <code>|Sha(E)|</code> in general,</li>
          <li>
            Determine whether its arithmetic structure is benign or obstructive,
          </li>
          <li>
            Or complete the leading-term identity even when analytic rank is
            known.
          </li>
        </ul>

        <p>
          As a result, the conjecture may be true while remaining epistemically
          inaccessible under current methods.
        </p>

        <h2>Falsifiable Constraint</h2>
        <p>
          Any claimed proof or counterexample to the full
          Birch and Swinnerton-Dyer conjecture must explicitly address the
          behavior of <code>Sha(E)</code>.
        </p>

        <p>Specifically, it must:</p>

        <ul>
          <li>
            Establish finiteness and arithmetic control of{" "}
            <code>Sha(E)</code>, or
          </li>
          <li>
            Demonstrate how unresolved behavior of{" "}
            <code>Sha(E)</code> is rendered immaterial, or
          </li>
          <li>
            Exhibit explicit obstructive behavior that disrupts the identity.
          </li>
        </ul>

        <h2>Non-Conclusions</h2>
        <ul>
          <li>
            No general proof or disproof of the full conjecture is known.
          </li>
          <li>
            Equality of rank and order of vanishing alone does not resolve BSD.
          </li>
          <li>
            Computational evidence in restricted cases does not address the
            general obstruction.
          </li>
        </ul>

        <h2>Canonical Classification</h2>
        <p>
          This entry is classified as an <strong>Edge of Knowledge</strong>{" "}
          artifact. It exposes an epistemic boundary without proposing action,
          optimization, or application.
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
