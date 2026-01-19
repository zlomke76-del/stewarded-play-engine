import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Phase-Locked Capillary Oscillation for Enhanced Solar Desalination | Moral Clarity AI",
  description:
    "Demonstrates how phase-locked capillary wave excitation at the water–air interface can increase evaporation rates beyond static solar thermal limits.",
  openGraph: {
    title: "Phase-Locked Capillary Oscillation for Enhanced Solar Desalination",
    description:
      "An Edge of Practice experiment showing how resonant interfacial oscillations can boost solar-driven evaporation.",
    url: "https://moralclarity.ai/edge-of-practice/phase-locked-capillary-oscillation",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PhaseLockedCapillaryOscillationPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Phase-Locked Capillary Oscillation for Enhanced Solar Desalination</h1>

        <p className="lead">
          <strong>
            A constructive interfacial physics experiment for increasing solar
            evaporation without new materials
          </strong>
        </p>

        <hr />

        <h2>One-Sentence Discovery</h2>

        <p>
          Solar thermal desalination systems systematically underperform because
          sub-millimeter capillary waves at the water–air interface are treated
          as passive surface roughness, when in fact they can be externally
          phase-locked to incoming solar flux to amplify evaporation.
        </p>

        <hr />

        <h2>The Physical Mechanism</h2>

        <p>
          Thin water films naturally support capillary wave modes determined by
          surface tension, density, and wavelength. When solar or thermal input
          is applied steadily, these modes remain weak and incoherent, limiting
          vapor flux to static thermal gradients.
        </p>

        <p>
          If incident energy is modulated at or near the natural resonance
          frequency of these capillary modes, interfacial oscillations can
          phase-lock to the forcing. This produces constructive amplification
          of surface motion, increasing local curvature, pressure gradients,
          and effective vapor-pressure differentials at the interface.
        </p>

        <p>
          The result is an evaporation rate that exceeds predictions from
          steady-state solar thermal models at equal mean energy input.
        </p>

        <hr />

        <h2>New Scientific Object</h2>

        <p>
          <strong>Capillary Resonance Coupling Coefficient (CRCC)</strong>
        </p>

        <p>
          The CRCC is defined as the measured increase in capillary wave
          amplitude (nanometers) induced when modulated optical or thermal input
          matches the natural resonance frequency of the water surface. It is
          observable via laser Doppler vibrometry or high-speed surface imaging
          and correlates directly with evaporation flux enhancement.
        </p>

        <hr />

        <h2>Edge of Practice Experiment</h2>

        <p>
          <strong>Assumption under test:</strong> External modulation of solar
          illumination at the capillary wave resonance frequency produces
          significantly greater surface oscillation and evaporation than steady
          illumination of equal mean intensity.
        </p>

        <h3>Materials</h3>

        <ul>
          <li>Shallow water tray (3–5 mm depth)</li>
          <li>Modulated light or thermal source (e.g., LED array or shuttered lamp)</li>
          <li>Controller for periodic modulation</li>
          <li>Precision scale for mass loss</li>
          <li>Thermometer</li>
          <li>Laser Doppler vibrometer or high-speed camera (optional but preferred)</li>
        </ul>

        <h3>Procedure</h3>

        <ol>
          <li>Fill tray with a fixed depth of water.</li>
          <li>Apply steady illumination and record baseline evaporation rate.</li>
          <li>Measure surface oscillation amplitude under steady conditions.</li>
          <li>
            Apply modulated illumination at the calculated capillary resonance
            frequency while maintaining equal mean intensity.
          </li>
          <li>Record evaporation rate and oscillation amplitude.</li>
          <li>
            Alternate between steady and modulated regimes to confirm
            repeatability.
          </li>
        </ol>

        <p>
          <strong>Binary outcome:</strong> If modulated illumination increases
          both CRCC and evaporation rate relative to the steady control, the
          effect exists. If not, it does not.
        </p>

        <hr />

        <h2>Why This Matters</h2>

        <p>
          This experiment opens a new axis for improving solar desalination and
          atmospheric water harvesting by exploiting interfacial physics rather
          than new materials or higher temperatures. It enables efficiency gains
          using passive modulation techniques compatible with low-cost,
          distributed water systems.
        </p>

        <p>
          Even modest gains compound meaningfully at scale, especially in
          water-stressed regions where simplicity and durability dominate
          design constraints.
        </p>

        <hr />

        <p className="text-sm text-muted-foreground">
          This experiment is published as part of{" "}
          <Link href="/edge-of-practice">Edge of Practice</Link>. It proposes no
          product, policy, or deployment claim and exists solely to test a
          hidden physical assumption governing real-world systems.
        </p>
      </article>
    </main>
  );
}
