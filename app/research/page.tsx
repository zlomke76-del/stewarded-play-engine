import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Research Index | Moral Clarity AI",
  description:
    "A structured index of public research, doctrines, and safety primitives developed by Moral Clarity AI.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ResearchIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Research</h1>

        <p className="lead">
          Public doctrines, safety primitives, and exploratory research documents.
        </p>

        <p>
          This index exists to orient readers across distinct lines of reasoning.
          Inclusion here does not imply endorsement, deployment readiness, or
          universal applicability. Each document defines its own scope,
          constraints, and falsification criteria.
        </p>

        <hr />

        <h2>Governing Doctrine</h2>
        <ul>
          <li>
            <Link href="/edge-of-knowledge">
              Governing Action at the Edge of Knowledge
            </Link>
            <br />
            <span className="text-sm text-muted-foreground">
              A doctrine for responsible intelligence when certainty breaks.
            </span>
          </li>
        </ul>

        <h2>Truth-Encoding & Safety Primitives</h2>
        <ul>
          <li>
            <Link href="/material-encoded-truth">
              Material-Encoded Truth
            </Link>
            <br />
            <span className="text-sm text-muted-foreground">
              Encoding cumulative risk directly into material structure.
            </span>
          </li>

          <li>
            <Link href="/space-truth-encoding">
              Space-Truth Encoding
            </Link>
            <br />
            <span className="text-sm text-muted-foreground">
              Making spatial configuration itself a carrier of irreversible truth.
            </span>
          </li>

          <li>
            <Link href="/damage-activated-materials">
              Damage-Activated Materials
            </Link>
            <br />
            <span className="text-sm text-muted-foreground">
              Systems that only activate signaling or function after real harm occurs.
            </span>
          </li>

          <li>
            <Link href="/exposure-redistributing-materials">
              Exposure-Redistributing Materials
            </Link>
            <br />
            <span className="text-sm text-muted-foreground">
              Harm reduction through redistribution, not elimination, of exposure.
            </span>
          </li>
        </ul>

        <hr />

        <p className="text-sm text-muted-foreground">
          This index is organizational only. Documents may later be classified,
          revised, superseded, or retired as evidence evolves.
        </p>
      </article>
    </main>
  );
}
