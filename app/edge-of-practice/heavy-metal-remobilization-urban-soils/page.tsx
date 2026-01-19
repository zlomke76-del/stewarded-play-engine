import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — Heavy Metals | Moral Clarity AI",
  description:
    "A civilization-scale assumption stress test examining whether heavy metals remain chemically immobilized under ordinary urban conditions.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function HeavyMetalsEdgePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Heavy Metal Stability in Ordinary Urban Environments</h1>

        <h2>Civilizational assumption under test</h2>
        <p>
          Heavy metals bound in typical urban soils remain chemically immobilized
          under ordinary environmental conditions and do not remobilize into
          water, air, or biological systems without direct disturbance.
        </p>

        <h2>Why this assumption is load-bearing</h2>
        <p>
          Urban planning, soil reuse, community gardening, infrastructure
          development, and environmental remediation policies rely on the belief
          that once heavy metals are buried, capped, or chemically bound, they
          remain stable unless actively excavated.
        </p>

        <p>
          This assumption governs land redevelopment decisions, green space
          creation, exposure classification, remediation closure standards, and
          long-term public health monitoring.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Collect soil from an urban location with documented or historically
          plausible heavy metal contamination. Remove debris and homogenize the
          sample.
        </p>

        <p>
          Place soil in a shallow, inert container with drainage capability. Over
          fourteen days, simulate ordinary rainfall by wetting the soil once
          daily with clean water, allowing full drainage between cycles.
        </p>

        <p>
          Collect runoff from each cycle in a clean, transparent container.
          Maintain a control sample from a nearby uncontaminated location,
          treated identically.
        </p>

        <p>Observe runoff for:</p>
        <ul>
          <li>Visible discoloration or staining</li>
          <li>Formation of precipitates or surface films</li>
          <li>Non-ambient metallic or chemical odors</li>
          <li>Residue accumulation after evaporation</li>
        </ul>

        <h2>Failure condition</h2>
        <p>
          Any <strong>persistent, observable indication of remobilization</strong>
          in contaminated runoff — absent in controls and persisting across
          multiple drainage cycles — constitutes failure of the assumption.
        </p>

        <h2>What breaks if this assumption is false</h2>
        <p>
          Urban land reuse models become unreliable, as buried contamination
          cannot be assumed stable under normal weather conditions. Community
          gardening and soil reuse initiatives expose populations to chronic,
          low-level chemical risk.
        </p>

        <p>
          Environmental remediation frameworks that declare sites safe based on
          immobilization thresholds must be revised to account for remobilization
          over time.
        </p>

        <hr />
        <p>
          <em>Status:</em> Final · Immutable
        </p>
      </article>
    </main>
  );
}
