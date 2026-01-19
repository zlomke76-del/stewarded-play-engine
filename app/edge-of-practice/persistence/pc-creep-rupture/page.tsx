import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Persistence — Long-Term Creep Rupture in Polycarbonate | Moral Clarity AI",
  description:
    "A persistence-level experiment examining irreversible creep rupture in polycarbonate under constant sub-yield mechanical load.",
  robots: { index: true, follow: true },
};

export default function PCCreepRupturePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Long-Term Creep Rupture in Polycarbonate</h1>

        <p className="lead">
          <strong>Persistence Regime:</strong> Mechanical
        </p>

        <h2>Assumption under test</h2>
        <p>
          Polycarbonate maintains dimensional stability and mechanical integrity
          indefinitely under constant moderate mechanical stress.
        </p>

        <h2>Irreversible physical mechanism</h2>
        <p>
          Slow creep deformation accumulates through molecular relaxation and
          microvoid growth until abrupt rupture occurs along the gauge section.
          This process is irreversible and unfolds only over years.
        </p>

        <h2>Why persistence timescales are required</h2>
        <p>
          Short- and extended-cycle tests do not reach the temporal threshold
          required for microvoid nucleation and creep-driven fracture at
          sub-yield loads.
        </p>

        <h2>MVP persistence experiment</h2>
        <ul>
          <li>Mold standard PC dogbone specimens</li>
          <li>Apply constant tensile load at 50% of yield strength</li>
          <li>Maintain ambient temperature and humidity</li>
          <li>Duration: 2–4 years</li>
        </ul>

        <h2>Binary kill condition</h2>
        <p>
          Complete fracture of the specimen within the gauge section with abrupt
          loss of load.
        </p>

        <h2>Estimated probability</h2>
        <p>0.7–0.8</p>

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
