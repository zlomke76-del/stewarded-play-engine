import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Persistence — Tribological Collapse in Nylon 66–Brass Sliding | Moral Clarity AI",
  description:
    "A persistence-level experiment tracking catastrophic wear regime transition in Nylon 66 sliding against brass.",
  robots: { index: true, follow: true },
};

export default function NylonBrassTribologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Tribological Collapse in Nylon 66–Brass Sliding</h1>

        <p className="lead">
          <strong>Persistence Regime:</strong> Tribological
        </p>

        <h2>Assumption under test</h2>
        <p>
          Nylon 66 bearings sliding against brass retain wear resistance and
          dimensional tolerance indefinitely under dry conditions.
        </p>

        <h2>Irreversible physical mechanism</h2>
        <p>
          Progressive accumulation of fine wear debris produces surface
          embrittlement and triggers an abrupt transition to a catastrophic
          high-wear regime.
        </p>

        <h2>Why persistence timescales are required</h2>
        <p>
          Initial wear rates appear stable; the irreversible transition only
          emerges after prolonged sliding over months to years.
        </p>

        <h2>MVP persistence experiment</h2>
        <ul>
          <li>Reciprocating nylon 66 slab against brass pin</li>
          <li>Moderate constant normal load</li>
          <li>Dry sliding, ambient environment</li>
          <li>Duration: 1–3 years</li>
        </ul>

        <h2>Binary kill condition</h2>
        <p>
          Sudden increase in wear scar depth or brass pin mass loss exceeding
          10%.
        </p>

        <h2>Estimated probability</h2>
        <p>0.65–0.8</p>

        <hr />

        <p className="text-sm text-muted-foreground">
          <Link href="/edge-of-practice">Short-Cycle</Link> ·{" "}
          <Link href="/edge-of-practice/extended-cycle">Extended Cycle</Link> ·{" "}
          <Link href="/edge-of-practice/persistence">Persistence Index</Link>
        </p>
      </article>
    </main>
  );
}
