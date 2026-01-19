import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Residual Microfragments from Compostable Packaging — Edge of Practice",
  description:
    "A home-compost experiment testing whether compostable plastics fully disintegrate under realistic conditions.",
  robots: { index: true, follow: true },
};

export default function CompostablePackagingMicrofragments() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Residual Microfragments from “Compostable” Packaging</h1>

        <h2>Hidden Assumption</h2>
        <p>
          Packaging labeled compostable fully disappears in home compost within
          a reasonable consumer timeframe.
        </p>

        <h2>Experimental Conditions</h2>
        <ul>
          <li>Home compost bin (ambient conditions)</li>
          <li>12-week composting period</li>
          <li>Typical moisture and turning frequency</li>
        </ul>

        <h2>Fragment Detection</h2>
        <p>
          Compost is dried, sieved (5 mm then 1 mm), and inspected under
          stereomicroscopy. Any fragment ≥1 mm is counted.
        </p>

        <h2>Binary Compostability Test</h2>
        <p>
          Presence of any ≥1 mm packaging fragment after 12 weeks constitutes
          failure.
        </p>

        <h2>Why This Matters</h2>
        <p>
          Directly tests consumer-facing compostability claims under real home
          conditions without policy or environmental extrapolation.
        </p>
      </article>
    </main>
  );
}
