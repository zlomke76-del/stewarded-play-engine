import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Edge of Practice — Surface Energy–Driven Anti-Fouling in HDPE | Moral Clarity AI",
  description:
    "A short-cycle experiment testing whether trace PTFE micropowder dispersed in HDPE can create persistent anti-fouling behavior through surface energy contrast alone.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function HDPEPTFESurfaceEnergyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          Surface Energy–Driven Anti-Fouling in HDPE via Trace PTFE Micropowder
        </h1>

        <h2>Civilizational assumption under test</h2>
        <p>
          Commodity polyolefin surfaces require coatings, high filler loadings,
          or chemical modification to achieve durable anti-fouling or
          anti-adhesion behavior.
        </p>

        <h2>Why this assumption is load-bearing</h2>
        <p>
          Packaging, hygiene products, infrastructure surfaces, and industrial
          handling systems assume that low-energy, non-stick behavior cannot be
          achieved in polyethylene without secondary coatings or exotic
          treatments. This drives cost, complexity, and failure under abrasion.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Disperse trace amounts (1–3 wt%) of PTFE micropowder into HDPE using
          standard twin-screw extrusion. Form films or molded plaques using
          conventional equipment, with no surface coating or post-treatment.
        </p>

        <p>
          The hypothesis is that PTFE forms discrete, stable low-energy domains
          at or near the surface, restructuring surface adhesion behavior through
          physical surface energy contrast alone.
        </p>

        <h2>Minimal test protocol</h2>
        <ul>
          <li>
            <strong>Processing:</strong> HDPE + 2 wt% PTFE micropowder, melt
            compounded and cast or molded
          </li>
          <li>
            <strong>Stability gate:</strong> 24-hour Soxhlet extraction in hot
            xylene; PTFE loss &lt;5% of added mass
          </li>
          <li>
            <strong>Functional test:</strong> Fine particulate adhesion (standard
            silica dust) measured before and after air-jet cleaning
          </li>
        </ul>

        <h2>Failure condition</h2>
        <p>
          Any of the following constitutes failure:
        </p>
        <ul>
          <li>Detectable PTFE loss exceeding 5%</li>
          <li>No measurable reduction in particle adhesion vs. neat HDPE</li>
          <li>Surface chalking, delamination, or cosmetic breakdown</li>
        </ul>

        <h2>What breaks if this assumption is false</h2>
        <p>
          If trace PTFE domains do not measurably alter surface adhesion, then
          surface energy contrast alone is insufficient to drive macroscopic
          anti-fouling behavior in commodity polyolefins without coatings or
          high filler loadings.
        </p>

        <h2>What changes if it holds</h2>
        <p>
          Anti-fouling and anti-caking behavior becomes accessible using
          commodity polymers, standard processing, and purely physical
          mechanisms—without chemical treatments, surface coatings, or
          regulatory complexity.
        </p>

        <hr />

        <p>
          <em>Status:</em> Final · Immutable
        </p>
      </article>
    </main>
  );
}
