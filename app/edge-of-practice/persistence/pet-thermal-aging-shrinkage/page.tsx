import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Persistence — Thermal Aging and Shrinkage in PET | Moral Clarity AI",
  description:
    "A persistence-level experiment probing irreversible physical aging and shrinkage in PET films under continuous sub-Tg heat.",
  robots: { index: true, follow: true },
};

export default function PETThermalAgingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Thermal Aging and Shrinkage in PET Films</h1>

        <p className="lead">
          <strong>Persistence Regime:</strong> Thermal
        </p>

        <h2>Assumption under test</h2>
        <p>
          PET retains dimensional stability and tensile properties under
          continuous moderate heat exposure for years.
        </p>

        <h2>Irreversible physical mechanism</h2>
        <p>
          Physical aging and enthalpic relaxation cause permanent shrinkage and
          embrittlement under sustained sub-Tg temperature exposure.
        </p>

        <h2>Why persistence timescales are required</h2>
        <p>
          Cumulative relaxation effects are undetectable in short or accelerated
          tests and only manifest after prolonged exposure.
        </p>

        <h2>MVP persistence experiment</h2>
        <ul>
          <li>Free-standing PET films</li>
          <li>Constant exposure at 70–80°C</li>
          <li>Dry air environment</li>
          <li>Duration: 2–5 years</li>
        </ul>

        <h2>Binary kill condition</h2>
        <p>
          &gt;10% permanent shrinkage or &gt;40% tensile strength loss.
        </p>

        <h2>Estimated probability</h2>
        <p>0.6–0.8</p>

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
