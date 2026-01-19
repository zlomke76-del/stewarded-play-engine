import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Longevity of Viral Viability on Indoor Surfaces — Edge of Practice",
  description:
    "A falsifiable laboratory experiment testing how long viruses remain infectious on common indoor surfaces under realistic conditions.",
  robots: { index: true, follow: true },
};

export default function ViralViabilityIndoorSurfaces() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Longevity of Viral Viability on Common Indoor Surfaces</h1>

        <h2>Problem Statement</h2>
        <p>
          This experiment measures how long a virus remains infectious on
          everyday indoor materials under normal indoor temperature and
          humidity. It tests surface persistence directly, without assuming
          transmission pathways or behavioral implications.
        </p>

        <h2>Hidden Assumption Being Tested</h2>
        <p>
          Viruses deposited on typical indoor surfaces lose infectivity within a
          short time window (often assumed to be less than 24 hours).
        </p>

        <h2>What Might Be True Instead</h2>
        <p>
          Some viruses may remain infectious on certain indoor surfaces for 24
          hours or longer under standard indoor conditions.
        </p>

        <h2>Minimal Experimental Setup</h2>
        <ul>
          <li>Surfaces: stainless steel, polypropylene plastic, glass, painted wood, cotton fabric</li>
          <li>Coupon size: 2 × 2 cm</li>
          <li>Virus: standardized non-pathogenic BSL-2 surrogate</li>
          <li>Environment: 22 °C ±2 °C, 45% ±5% RH</li>
          <li>Time points: 0, 1, 4, 8, 24, 48, 72 hours</li>
          <li>Replicates: triplicate per surface per time point</li>
        </ul>

        <h2>Measurement Method</h2>
        <p>
          Virus is eluted from surfaces using standardized buffer and quantified
          using plaque assay or TCID<sub>50</sub>. Results are reported as
          infectious titer.
        </p>

        <h2>Binary Kill Condition</h2>
        <ul>
          <li><strong>Pass:</strong> No detectable infectious virus on all surfaces at or before 24 hours.</li>
          <li><strong>Fail:</strong> Infectious virus detected on any surface at 24 hours or later.</li>
        </ul>

        <h2>Controls & Confounders</h2>
        <ul>
          <li>Positive control: viral stock viability</li>
          <li>Negative control: uninoculated surfaces</li>
          <li>Confounders: drying time, inoculum volume, surface cleanliness</li>
        </ul>

        <h2>Safety & Ethics</h2>
        <p>
          Conducted in certified BSL-2 laboratories. No human or animal testing.
        </p>

        <h2>Why This Matters</h2>
        <p>
          Persistence beyond assumed timelines would invalidate common surface
          hygiene assumptions and affect cleaning interval guidance in shared
          spaces.
        </p>
      </article>
    </main>
  );
}
