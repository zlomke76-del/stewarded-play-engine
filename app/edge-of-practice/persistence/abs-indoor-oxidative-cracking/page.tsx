import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Persistence — Oxidative Cracking of ABS in Indoor Air | Moral Clarity AI",
  description:
    "A persistence-level experiment tracking slow oxidative microcracking of ABS under real indoor atmospheric exposure.",
  robots: { index: true, follow: true },
};

export default function ABSOxidationPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Oxidative Microcracking of ABS in Indoor Air</h1>

        <p className="lead">
          <strong>Persistence Regime:</strong> Environmental
        </p>

        <h2>Assumption under test</h2>
        <p>
          Uncoated ABS does not undergo catastrophic cracking or embrittlement
          under ordinary indoor atmospheric exposure.
        </p>

        <h2>Irreversible physical mechanism</h2>
        <p>
          Slow oxidation from ozone and ambient pollutants accumulates subsurface
          damage, producing irreversible cracking and brittle failure.
        </p>

        <h2>Why persistence timescales are required</h2>
        <p>
          Accelerated or clean-air testing fails to reproduce cumulative
          pollutant exposure experienced in real indoor environments.
        </p>

        <h2>MVP persistence experiment</h2>
        <ul>
          <li>Uncoated ABS bars</li>
          <li>Exposure in ordinary office or urban indoor air</li>
          <li>Ambient temperature and humidity</li>
          <li>Duration: 3–5 years</li>
        </ul>

        <h2>Binary kill condition</h2>
        <p>
          Visible surface cracking or brittle fracture in standardized impact
          test.
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
