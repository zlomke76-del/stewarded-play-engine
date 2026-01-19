import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — Fatigue Energy Dissipation in PP/CaCO₃ | Moral Clarity AI",
  description:
    "Tests whether untreated calcium carbonate inclusions improve polypropylene fatigue resistance via crack deflection under cyclic loading.",
  robots: { index: true, follow: true },
};

export default function PPCaCO3FatiguePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Fatigue Energy Dissipation in Polypropylene via Untreated Calcium Carbonate</h1>

        <h2>Assumption under test</h2>
        <p>
          Mineral fillers uniformly reduce fatigue life in polypropylene by increasing brittleness.
        </p>

        <h2>Why this assumption matters</h2>
        <p>
          Commodity plastics are evaluated almost exclusively under static tensile and impact tests.
          Fatigue resistance is inferred, not measured, despite its dominance in real-world failure.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Injection mold polypropylene containing 15 wt% untreated calcium carbonate.
          Subject samples to low-strain cyclic flexural fatigue for 10<sup>5</sup>–10<sup>6</sup> cycles.
        </p>

        <h2>Failure condition</h2>
        <p>
          Earlier crack initiation or reduced fatigue life relative to neat polypropylene.
        </p>

        <h2>Pass criterion</h2>
        <p>
          ≥30% increase in cycles to crack initiation compared to neat polypropylene.
        </p>

        <hr />
        <p><em>Status:</em> Final · Mid-Cycle</p>
      </article>
    </main>
  );
}
