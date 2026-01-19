import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Persistence — Indoor Optical Aging of Polysulfone | Moral Clarity AI",
  description:
    "A persistence-level experiment examining slow photo-oxidative yellowing and haze formation in polysulfone under indoor daylight.",
  robots: { index: true, follow: true },
};

export default function PSUOpticalAgingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Indoor Optical Aging of Polysulfone</h1>

        <p className="lead">
          <strong>Persistence Regime:</strong> Optical
        </p>

        <h2>Assumption under test</h2>
        <p>
          Polysulfone maintains color and transparency during years-long indoor
          daylight exposure.
        </p>

        <h2>Irreversible physical mechanism</h2>
        <p>
          Slow photo-oxidation from low-intensity light produces permanent color
          center formation and transmission loss.
        </p>

        <h2>Why persistence timescales are required</h2>
        <p>
          Accelerated tests do not reproduce cumulative photon dose and oxidative
          stress typical of indoor environments.
        </p>

        <h2>MVP persistence experiment</h2>
        <ul>
          <li>PSU sheets mounted behind window glass</li>
          <li>Indirect daylight exposure only</li>
          <li>Ambient indoor conditions</li>
          <li>Duration: 2–4 years</li>
        </ul>

        <h2>Binary kill condition</h2>
        <p>
          Delta E &gt; 3 or &gt;10% loss in light transmission.
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
