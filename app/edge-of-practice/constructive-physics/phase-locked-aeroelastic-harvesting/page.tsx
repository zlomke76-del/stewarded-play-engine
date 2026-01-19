import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phase-Locked Aeroelastic Resonant Harvesting | Moral Clarity AI",
  description:
    "A constructive physics experiment using controlled aeroelastic resonance to harvest wind energy without rotating turbines.",
  openGraph: {
    title: "Phase-Locked Aeroelastic Resonant Harvesting",
    description:
      "Harnessing stable aeroelastic oscillations for low-speed wind energy conversion.",
    url: "https://moralclarity.ai/edge-of-practice/constructive-physics/phase-locked-aeroelastic-harvesting",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function PhaseLockedAeroelasticHarvestingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Phase-Locked Aeroelastic Resonant Harvesting</h1>

        <p className="lead">
          <strong>
            Wind-driven structural oscillations can be stabilized into
            phase-locked resonance regimes that efficiently convert airflow
            into usable energy.
          </strong>
        </p>

        <h2>One-Sentence Discovery</h2>
        <p>
          Aeroelastic instabilities such as flutter and galloping can be
          deliberately tuned into stable, phase-locked oscillations that
          continuously extract energy from low-speed winds.
        </p>

        <h2>The Physical Mechanism</h2>
        <p>
          Slender structures exposed to crossflow naturally enter oscillatory
          regimes when aerodynamic forces couple with structural elasticity.
          By tuning stiffness, damping, and mass, these oscillations can be
          confined to a stable resonance band where energy transfer from wind
          to structure is sustained and predictable.
        </p>

        <h2>New Scientific Object</h2>
        <p>
          <strong>Aeroelastic Phase Capture Window (APCW)</strong>: the region in
          frequency–amplitude space where aeroelastic oscillations are
          self-sustaining, phase-stable, and optimally coupled to energy
          transduction.
        </p>

        <h2>Edge-of-Practice Experiment</h2>
        <p>
          Install a tunable flexible beam with piezoelectric or electromagnetic
          coupling in a variable-speed wind tunnel. Adjust parameters to locate
          the phase capture window and measure net energy output.
        </p>
        <p>
          <strong>Binary outcome:</strong> Repeatable net energy generation at
          wind speeds below turbine cut-in confirms the mechanism.
        </p>

        <h2>Why This Matters</h2>
        <p>
          Enables quiet, compact, non-rotational wind energy devices suitable
          for urban and low-wind environments where conventional turbines fail.
        </p>
      </article>
    </main>
  );
}
