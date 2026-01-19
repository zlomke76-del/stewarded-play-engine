// app/edge-of-practice/pc-pmma-scratch-resistance/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Edge of Practice — Polycarbonate Surface Hardening via PMMA Dispersion | Moral Clarity AI",
  description:
    "A short-cycle experiment testing whether low-level PMMA dispersion in polycarbonate produces durable surface scratch resistance without coatings or chemical modification.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PCPMMAScratchResistancePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          Surface Scratch Resistance in Polycarbonate via Low-Level PMMA Dispersion
        </h1>

        <h2>Civilizational assumption under test</h2>
        <p>
          Improving scratch resistance in transparent polycarbonate requires
          surface coatings, chemical hardening, or specialty additives, and
          cannot be achieved through simple physical blending without degrading
          optical clarity or impact resistance.
        </p>

        <h2>Why this assumption is load-bearing</h2>
        <p>
          Consumer electronics, automotive interiors, architectural glazing, and
          medical devices rely heavily on polycarbonate for impact resistance.
          However, surface scratching remains a dominant failure mode that
          shortens product lifespan and degrades usability.
        </p>

        <p>
          Current mitigation strategies depend on coatings, multi-step surface
          treatments, or proprietary chemistries that add cost, complexity, and
          long-term failure risk through delamination or wear.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Prepare polycarbonate samples containing a low loading of
          polymethyl methacrylate (PMMA) physically dispersed in the bulk
          polymer. No chemical compatibilizers, surface coatings, or post-process
          treatments are permitted.
        </p>

        <p>
          Process material using standard twin-screw extrusion followed by
          injection molding into flat plaques suitable for optical and abrasion
          testing. PMMA loading should remain below levels associated with bulk
          phase separation or loss of transparency.
        </p>

        <h2>Hypothesis</h2>
        <p>
          During melt processing, PMMA preferentially migrates toward the
          polycarbonate surface, forming discrete, mechanically harder
          microdomains. These domains increase resistance to abrasion and
          scratching through purely physical reinforcement of the surface layer,
          without altering bulk mechanical performance.
        </p>

        <h2>Minimal test protocol</h2>
        <ul>
          <li>
            <strong>Material preparation:</strong> Polycarbonate with ~10 wt%
            PMMA, injection molded into test plaques
          </li>
          <li>
            <strong>Environmental stability check:</strong> 72-hour exposure at
            40°C and 75% relative humidity
          </li>
          <li>
            <strong>Functional test:</strong> Taber abrasion testing (1000
            cycles) measuring haze increase or mass loss
          </li>
          <li>
            <strong>Control:</strong> Neat polycarbonate plaques processed under
            identical conditions
          </li>
        </ul>

        <h2>Failure condition</h2>
        <p>
          Any of the following outcomes constitutes failure of the assumption:
        </p>
        <ul>
          <li>Visible surface blooming or phase separation after humidity cycling</li>
          <li>Loss of optical clarity exceeding that of neat polycarbonate</li>
          <li>
            Taber abrasion haze increase or mass loss not reduced by at least
            50% relative to control
          </li>
        </ul>

        <h2>What breaks if this assumption is false</h2>
        <p>
          The belief that surface durability in transparent polymers must rely
          on coatings or chemical modification remains intact, reinforcing
          higher-cost, higher-complexity manufacturing pathways and continued
          reliance on surface treatments with finite lifetimes.
        </p>

        <h2>What breaks if this assumption is true</h2>
        <p>
          A purely physical, coating-free pathway for improving scratch
          resistance in commodity polycarbonate becomes viable, challenging
          long-standing material selection and qualification practices across
          consumer, industrial, and architectural applications.
        </p>

        <hr />

        <p>
          <em>Status:</em> Final · Immutable
        </p>
      </article>
    </main>
  );
}
