import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Effect of Domestic Hot Water pH on Plumbing Metal Leaching — Edge of Practice",
  description:
    "A controlled experiment testing whether realistic domestic hot water pH changes alter metal leaching from plumbing materials.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function HotWaterPhMetalLeachingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Effect of Domestic Hot Water pH on Plumbing Metal Leaching</h1>

        <h2>Problem Statement</h2>
        <p>
          This experiment determines whether changing the pH of household hot
          water, within realistic domestic ranges, alters the amount of metal
          leached from typical plumbing materials during a single day of
          exposure. No regulatory, safety, or health conclusions are drawn.
        </p>

        <h2>Hidden Assumption Being Tested</h2>
        <p>
          Modest pH variation in domestic hot water does not meaningfully affect
          metal leaching from plumbing materials over short time scales.
        </p>

        <h2>What Might Be True Instead</h2>
        <p>
          Even small, realistic changes in hot water pH may significantly
          increase metal leaching from common plumbing materials.
        </p>

        <h2>Materials and Preparation</h2>
        <ul>
          <li>Copper pipe coupons (2 cm × 5 cm, cleaned, uncoated)</li>
          <li>Galvanized steel pipe coupons (2 cm × 5 cm, cleaned, uncoated)</li>
          <li>Deionized water</li>
          <li>Dilute HCl and dilute NaOH for pH adjustment</li>
          <li>Calibrated pH meter</li>
          <li>Hot water bath or temperature-controlled incubator</li>
          <li>Polyethylene bottles with tight-sealing lids</li>
          <li>ICP-MS or equivalent trace metal analyzer</li>
          <li>Clean pipettes and sample vials</li>
          <li>Personal protective equipment</li>
        </ul>

        <h2>Experimental Parameters</h2>
        <ul>
          <li>pH values: 6.5, 7.5, 8.5</li>
          <li>Neutral control: unadjusted water (≈ pH 7.0)</li>
          <li>Temperature: 60 °C (±2 °C)</li>
          <li>Exposure time: 24 hours</li>
        </ul>

        <h2>Experimental Procedure</h2>
        <ol>
          <li>
            Adjust deionized water to target pH values using dilute HCl or NaOH.
          </li>
          <li>
            Place one copper coupon and one galvanized steel coupon into
            separate bottles for each pH condition.
          </li>
          <li>
            Add 100 mL of prepared water to fully submerge each coupon.
          </li>
          <li>
            Seal bottles and place in a 60 °C water bath or incubator for
            24 hours.
          </li>
          <li>
            After exposure, allow bottles to cool to room temperature.
          </li>
          <li>
            Remove coupons with clean forceps and gently mix the water.
          </li>
          <li>
            Collect 50 mL of each water sample into labeled vials.
          </li>
          <li>
            Measure and record final pH of each sample.
          </li>
        </ol>

        <h2>Analytical Method</h2>
        <ul>
          <li>Calibrate ICP-MS using standards for copper, lead, zinc, and iron</li>
          <li>Analyze samples for metal concentrations (µg/L)</li>
          <li>Run procedural blanks to verify background levels</li>
        </ul>

        <h2>Binary Exceedance Condition</h2>
        <p>
          For each metal and material, calculate the difference between the test
          pH condition and the neutral control.
        </p>
        <ul>
          <li>
            <strong>TRUE:</strong> Any pH condition yields a concentration ≥10
            µg/L higher than the neutral control.
          </li>
          <li>
            <strong>FALSE:</strong> No pH condition exceeds the neutral control
            by ≥10 µg/L.
          </li>
        </ul>

        <h2>Controls and Confounders</h2>
        <ul>
          <li>Coupons must be fully uncoated and thoroughly rinsed</li>
          <li>pH drift greater than ±0.3 invalidates the run</li>
          <li>Temperature must remain within ±2 °C</li>
          <li>Cross-contamination between samples must be avoided</li>
          <li>Each condition performed at least in duplicate</li>
        </ul>

        <h2>Output</h2>
        <p>
          Report measured metal concentrations and note any exceedance events.
          The outcome is strictly binary per metal and material.
        </p>

        <h2>Scope Boundaries</h2>
        <p>
          This experiment does not assess health risk, regulatory compliance,
          water safety, or engineering recommendations. Results apply only to
          the defined materials, pH range, and exposure conditions.
        </p>

        <hr />

        <p className="text-sm text-muted-foreground">
          Edge-of-Practice experiments are designed for short-cycle execution,
          clear falsification, and direct reproducibility. No extrapolation is
          permitted.
        </p>
      </article>
    </main>
  );
}
