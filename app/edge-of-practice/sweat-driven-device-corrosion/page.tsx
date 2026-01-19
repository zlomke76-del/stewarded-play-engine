import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sweat-Driven Corrosion of Device Metals — Edge of Practice",
  description:
    "A controlled experiment testing whether human sweat and skin oils accelerate corrosion of common device metals.",
  robots: { index: true, follow: true },
};

export default function SweatDrivenCorrosion() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Acceleration of Device Metal Corrosion Due to Sweat and Skin Oils</h1>

        <h2>Hidden Assumption</h2>
        <p>
          Metals in handheld devices corrode insignificantly under normal skin
          contact conditions.
        </p>

        <h2>Experimental Materials</h2>
        <ul>
          <li>Metals: 316L stainless steel, aluminum 6061, copper</li>
          <li>Coupon size: 10 × 10 × 1 mm</li>
          <li>Synthetic sweat (ISO 3160-2)</li>
          <li>Synthetic skin oil formulation</li>
        </ul>

        <h2>Exposure Protocol</h2>
        <p>
          Daily 8-hour exposure to simulants followed by drying, repeated for 14
          days under controlled temperature and humidity.
        </p>

        <h2>Measurements</h2>
        <ul>
          <li>Mass loss (analytical balance)</li>
          <li>Metal ion release (ICP-MS)</li>
          <li>EIS and open circuit potential</li>
        </ul>

        <h2>Binary Falsification Threshold</h2>
        <p>
          The assumption fails if sweat + oil exposure does not produce a
          statistically significant increase in corrosion relative to controls.
        </p>

        <h2>Why This Matters</h2>
        <p>
          Results directly inform material selection and durability assumptions
          for consumer electronics without making health or regulatory claims.
        </p>
      </article>
    </main>
  );
}
