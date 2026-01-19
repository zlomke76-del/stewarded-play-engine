import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edge of Practice — Persistence Experiments | Moral Clarity AI",
  description:
    "Persistence-level experiments where irreversible failure emerges only after years of exposure, load, or environmental interaction.",
  robots: { index: true, follow: true },
};

export default function EdgeOfPracticePersistencePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Edge of Practice — Persistence</h1>

        <p className="lead">
          <strong>Where time itself becomes the experiment</strong>
        </p>

        <p>
          <em>Persistence</em> experiments test assumptions that survive short-
          and extended-cycle falsification but may fail irreversibly only after
          years. These experiments do not optimize performance—they document
          slow, unavoidable breakdown.
        </p>

        <hr />

        <h2>Persistence Experiments</h2>

        <ul>
          <li>
            <Link href="/edge-of-practice/persistence/pc-creep-rupture">
              Long-Term Creep Rupture in Polycarbonate
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/persistence/nylon66-brass-tribological-collapse">
              Tribological Collapse in Nylon 66–Brass Sliding
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/persistence/pet-thermal-aging-shrinkage">
              Thermal Aging and Shrinkage in PET Films
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/persistence/psu-indoor-optical-aging">
              Indoor Optical Aging of Polysulfone
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/persistence/abs-indoor-oxidative-cracking">
              Oxidative Microcracking of ABS in Indoor Air
            </Link>
          </li>
        </ul>

        <hr />

        <p className="text-sm text-muted-foreground">
          <Link href="/edge-of-practice">Short-Cycle</Link> ·{" "}
          <Link href="/edge-of-practice/extended-cycle">Extended Cycle</Link>
        </p>
      </article>
    </main>
  );
}
