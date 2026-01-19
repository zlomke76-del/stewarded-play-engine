import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Edge Canon: Invariants, Not Interpretations | Edge of Practice — Moral Clarity AI",
  description:
    "The governing framework for all Edge of Practice experiments, defining how assumptions are reduced to symmetry, conservation, invariant spectra, and falsifiable failure signatures.",
  openGraph: {
    title: "Edge Canon: Invariants, Not Interpretations",
    description:
      "A formal framework for exposing false assumptions by reducing systems to symmetry, conserved quantities, invariant observables, and non-negotiable failure signatures.",
    url: "https://moralclarity.ai/edge-of-practice/canon",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EdgeCanonPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Edge Canon: Invariants, Not Interpretations</h1>

        <p className="lead">
          <strong>
            Edge of Practice experiments are governed by invariant structure,
            not interpretation, optimization, or narrative explanation.
          </strong>
        </p>

        <p>
          This page defines the canonical framework that every Edge of Practice
          experiment must satisfy. If an experiment cannot be expressed within
          this structure, it does not belong in the Edge of Practice index.
        </p>

        <hr />

        <h2>The Governing Reduction</h2>

        <p>
          Every Edge of Practice entry is reduced to four elements:
        </p>

        <ol>
          <li>
            <strong>Symmetry Group (𝑮)</strong> — the set of transformations
            under which invariance is claimed.
          </li>
          <li>
            <strong>Conserved Quantity (𝑸)</strong> — the quantity preserved
            under those transformations.
          </li>
          <li>
            <strong>Invariant Spectrum (𝑺)</strong> — the set of observables
            that cannot be transformed away under 𝑮.
          </li>
          <li>
            <strong>Failure Signature</strong> — a categorical change in 𝑺
            indicating loss of the claimed invariance.
          </li>
        </ol>

        <p>
          This reduction is non-negotiable. No averages, proxies, or narratives
          are permitted unless they correspond directly to an invariant
          observable.
        </p>

        <hr />

        <h2>What Is Explicitly Discarded</h2>

        <ul>
          <li>Mean behavior or averaged metrics</li>
          <li>Proxy indicators not tied to invariant observables</li>
          <li>Optimization goals or performance tuning</li>
          <li>Interpretive explanations without falsifiable structure</li>
          <li>Gradualist reasoning that ignores threshold or percolation effects</li>
        </ul>

        <p>
          If a claim survives only by aggregation, smoothing, or narrative
          framing, it is excluded by design.
        </p>

        <hr />

        <h2>Failure Is Defined on the Spectrum</h2>

        <p>
          Edge of Practice does not ask whether a system degrades slowly or
          improves on average. It asks whether a new, forbidden, or dominant
          invariant value appears.
        </p>

        <p>
          Failure signatures are therefore defined as:
        </p>

        <ul>
          <li>Step changes</li>
          <li>Knees or discontinuities</li>
          <li>Emergence of system-spanning connectivity</li>
          <li>Appearance of new extreme spectral values</li>
        </ul>

        <p>
          If such a signature appears, the original assumption is invalidated
          regardless of average behavior.
        </p>

        <hr />

        <h2>The Role of Solace</h2>

        <p>
          Solace does not optimize, recommend, or invent. Her role is to enforce
          invariant structure.
        </p>

        <p>
          She:
        </p>

        <ul>
          <li>Freezes assumptions</li>
          <li>Identifies symmetry claims</li>
          <li>Isolates conserved quantities</li>
          <li>Rejects non-invariant observables</li>
          <li>Defines falsification only on invariant spectra</li>
        </ul>

        <p>
          This constraint is what prevents drift. Any reasoning step that
          violates invariant structure is refused.
        </p>

        <hr />

        <h2>Scope of the Canon</h2>

        <p>
          This framework applies across materials, biology, automation,
          computation, energy systems, and institutional design. Domain-specific
          details may vary; the invariant grammar does not.
        </p>

        <p>
          Edge of Practice exists to surface reality where assumptions dominate
          action. The Canon defines how that surfacing is done.
        </p>

        <hr />

        <p className="text-sm opacity-70">
          This page governs all entries in the{" "}
          <Link href="/edge-of-practice">
            Edge of Practice short-cycle experiment index
          </Link>
          .
        </p>
      </article>
    </main>
  );
}
