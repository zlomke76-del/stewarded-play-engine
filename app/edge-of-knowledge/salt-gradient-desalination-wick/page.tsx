import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salt-Gradient Desalination Wick | Edge of Knowledge",
  description:
    "An edge publication documenting a salt-gradient-driven desalination wick using passive thermal and capillary mechanisms, including explicit uncertainties, failure modes, and test directions.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function SaltGradientDesalinationWickPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Salt-Gradient Desalination Wick</h1>

        <p className="text-lg font-medium">
          Edge of Knowledge <span aria-hidden>→</span> uncertainty acknowledged
        </p>

        <hr />

        <section>
          <h2>Core Hypothesis</h2>
          <p>
            A desalination process can be driven by a maintained salt
            concentration gradient across a porous wick structure, where
            capillary transport and low-grade thermal input promote preferential
            vapor transport while inhibiting bulk salt crossover.
          </p>
          <p>
            The system relies on established physical mechanisms—osmotic
            gradients, capillarity, evaporation, and diffusion—without pumps or
            active pressure differentials.
          </p>
        </section>

        <section>
          <h2>Physical Mechanisms in Use</h2>
          <ul>
            <li>Capillary-driven liquid transport through a porous wick</li>
            <li>Salt-gradient-induced vapor pressure differentials</li>
            <li>Localized evaporation at the warm interface</li>
            <li>Condensation and collection on the low-salinity side</li>
          </ul>
        </section>

        <section>
          <h2>What Is Known</h2>
          <ul>
            <li>
              Capillary wicks can sustain continuous liquid transport without
              external energy input.
            </li>
            <li>
              Salt concentration gradients alter vapor pressure and evaporation
              dynamics.
            </li>
            <li>
              Low-grade heat (solar or waste heat) can sustain steady evaporation
              in thin porous media.
            </li>
          </ul>
        </section>

        <section>
          <h2>What Is Uncertain</h2>
          <ul>
            <li>
              Long-term salt accumulation and crystallization within the wick
              structure
            </li>
            <li>
              Stability of the gradient under continuous operation
            </li>
            <li>
              Effective flux limits at practical temperature differentials
            </li>
            <li>
              Membrane or wick wetting leading to salt breakthrough
            </li>
          </ul>
        </section>

        <section>
          <h2>Failure Modes</h2>
          <ul>
            <li>
              Salt crystallization blocking capillary pathways and halting flow
            </li>
            <li>
              Gradient collapse due to insufficient evaporation or excessive
              back-diffusion
            </li>
            <li>
              Thermal losses overwhelming evaporation gains
            </li>
            <li>
              Mechanical degradation or fouling of the wick material
            </li>
          </ul>
        </section>

        <section>
          <h2>Test Directions</h2>
          <ol>
            <li>
              Construct a bench-scale wick assembly with controlled salt
              concentration on the feed side.
            </li>
            <li>
              Apply low-grade thermal input (solar simulator or heated plate).
            </li>
            <li>
              Measure mass flux, salt concentration crossover, and temperature
              gradients over time.
            </li>
            <li>
              Observe and document salt deposition, wick degradation, or flow
              interruption.
            </li>
          </ol>
        </section>

        <section>
          <h2>Why This Is Published Here</h2>
          <p>
            This system is published at the Edge of Knowledge because its
            feasibility depends on interacting gradients and degradation modes
            that are not fully characterized at operational timescales.
          </p>
          <p>
            The intent is not to claim performance, but to expose mechanisms,
            uncertainties, and failure paths clearly enough that the concept can
            be validated—or disproven—by direct experimentation.
          </p>
        </section>
      </article>
    </main>
  );
}
