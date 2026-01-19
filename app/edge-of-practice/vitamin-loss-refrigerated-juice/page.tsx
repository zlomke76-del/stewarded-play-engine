import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vitamin Loss in Refrigerated Juice — Edge of Practice",
  description:
    "A simple laboratory test measuring vitamin degradation in fresh juice under home refrigeration conditions.",
  robots: { index: true, follow: true },
};

export default function VitaminLossJuice() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Vitamin Content Loss in Home-Stored Fresh Juices</h1>

        <h2>Hidden Assumption</h2>
        <p>
          Fresh juice retains most of its vitamin content during short-term
          refrigeration.
        </p>

        <h2>Vitamins Tested</h2>
        <ul>
          <li>Vitamin C (ascorbic acid)</li>
          <li>Vitamin B6 (pyridoxine)</li>
        </ul>

        <h2>Storage Conditions</h2>
        <p>
          Juice stored at 4 °C ±1 °C for 48 hours in sealed food-grade containers.
        </p>

        <h2>Assay Methods</h2>
        <ul>
          <li>Vitamin C: DCPIP titration</li>
          <li>Vitamin B6: colorimetric assay</li>
        </ul>

        <h2>Binary Failure Definition</h2>
        <p>
          Loss ≥20% for either vitamin within 48 hours constitutes failure of
          the assumption.
        </p>

        <h2>Why This Matters</h2>
        <p>
          Directly tests nutritional assumptions underlying storage advice and
          consumer expectations.
        </p>
      </article>
    </main>
  );
}
