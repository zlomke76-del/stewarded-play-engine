// app/whitepapers/passive-source-control/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Passive Source-Control Materials: A NO-GO Assessment | Moral Clarity AI",
  description:
    "A physics-grounded evaluation of whether passive materials or geometry can bias particle formation or trajectories before aerosolization.",
  openGraph: {
    title:
      "Passive Source-Control Materials: A NO-GO Assessment",
    description:
      "An honest assessment of passive, non-powered attempts to reduce aerosol risk at the emission source—and why they fail to scale.",
    url: "https://moralclarity.ai/whitepapers/passive-source-control",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PassiveSourceControlWhitepaper() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Passive Source-Control Materials</h1>
        <p className="lead">
          <strong>
            Can Materials Bias Particle Trajectories Before Aerosolization?
          </strong>
        </p>

        <p className="text-sm text-muted-foreground">
          White Paper · Public Reference · Moral Clarity AI
        </p>

        <h2>Abstract</h2>
        <p>
          Source control is one of the most effective strategies for reducing
          aerosol-based transmission risk. Beyond masks and filtration, interest
          has emerged in whether passive materials or surface geometries—without
          power, chemistry, or active airflow—can bias particle formation or
          trajectories before aerosols become freely suspended. This paper
          evaluates the physical plausibility, scalability, and ethical viability
          of such passive source-control approaches. We conclude that while
          limited physical effects exist under constrained conditions, they do
          not scale reliably to real-world use.
        </p>

        <h2>1. Physical Plausibility</h2>
        <p>
          Certain physical mechanisms can, in principle, influence droplet
          formation or early motion at the point of emission:
        </p>
        <ul>
          <li>
            <strong>Droplet breakup dynamics:</strong> Wettability and surface
            microstructure may bias droplet size toward larger, faster-settling
            droplets.
          </li>
          <li>
            <strong>Coalescence and size biasing:</strong> Structured surfaces
            near the emission point may encourage early droplet merging.
          </li>
          <li>
            <strong>Momentum dissipation or redirection:</strong> Ridges,
            baffles, or porous barriers can alter initial trajectories.
          </li>
          <li>
            <strong>Early interception or impaction:</strong> Close-range
            materials may intercept droplets before full aerosolization.
          </li>
          <li>
            <strong>Boundary-layer disruption:</strong> Microtexture can affect
            droplet detachment and speed.
          </li>
        </ul>
        <p>
          These effects require direct, close-range physical interaction.
          Benefits vanish rapidly as contact probability decreases. Any implicit
          airflow obstruction introduces hidden filtration rather than pure
          material causality.
        </p>

        <h2>2. Regime and Scale Analysis</h2>

        <h3>Likely to Function</h3>
        <ul>
          <li>High-velocity, focused emission events (e.g., coughs, sneezes)</li>
          <li>Constrained emission geometries with consistent placement</li>
          <li>Point-of-care or point-of-exhaust contexts</li>
        </ul>

        <h3>Marginal or Context-Dependent</h3>
        <ul>
          <li>Normal breathing or speech</li>
          <li>Variable posture, humidity, and temperature</li>
          <li>Intermittent or inconsistent contact with materials</li>
        </ul>

        <h3>Expected to Fail</h3>
        <ul>
          <li>Fully aerosolized emissions</li>
          <li>Poor fit or inconsistent usage</li>
          <li>Room-scale or long-range transmission scenarios</li>
        </ul>

        <p>
          Any benefit decays rapidly outside tightly controlled, close-contact
          regimes and does not scale to population-level use.
        </p>

        <h2>3. Confounds and Failure Modes</h2>
        <ul>
          <li>
            <strong>Airflow restriction:</strong> Apparent benefits often arise
            from reduced airflow rather than material effects.
          </li>
          <li>
            <strong>Behavioral modification:</strong> Users may alter posture or
            emission intensity in response to devices.
          </li>
          <li>
            <strong>Hygiene degradation:</strong> Moisture accumulation and
            fouling degrade performance over time.
          </li>
          <li>
            <strong>Comfort and compliance:</strong> Discomfort leads to misuse
            or abandonment.
          </li>
          <li>
            <strong>Misattribution:</strong> Environmental or measurement
            artifacts may be mistaken for physical causality.
          </li>
        </ul>

        <h2>4. Falsification Criteria</h2>
        <p>
          Decisive falsification requires:
        </p>
        <ul>
          <li>
            High-speed imaging and particle sizing at the emission point
          </li>
          <li>
            Matched airflow conditions with and without the intervention
          </li>
          <li>
            Controls isolating physical effects from behavioral changes
          </li>
          <li>
            Repetition across users, humidity, and temperature
          </li>
        </ul>
        <p>
          <strong>NO-GO condition:</strong> If shifts in droplet size, momentum,
          or aerosol fraction disappear when airflow and behavior are controlled,
          or fall within measurement noise.
        </p>

        <h2>5. Humanitarian and Ethical Assessment</h2>
        <p>
          Benefits are limited, incremental, and highly scenario-dependent.
          Overstatement risks behavioral risk compensation and undermining of
          proven interventions.
        </p>
        <p>
          Ethical deployment requires explicit communication that such approaches
          are supplementary only and do not replace masks, ventilation, or
          established source-control measures.
        </p>

        <h2>6. Comparison to Existing Interventions</h2>
        <ul>
          <li>
            <strong>Masks:</strong> Proven kinetic and filtration-based source
            control.
          </li>
          <li>
            <strong>Respirators:</strong> Robust performance across emission
            variability.
          </li>
          <li>
            <strong>Behavioral measures:</strong> Address risk at the source with
            known trade-offs.
          </li>
          <li>
            <strong>Ventilation:</strong> Reduces downstream risk but does not
            modify source emission.
          </li>
          <li>
            <strong>Passive materials:</strong> Fragile, regime-limited, and
            unreliable at scale.
          </li>
        </ul>

        <h2>7. Final Judgment</h2>
        <p>
          <strong>Decision: NO-GO.</strong>
        </p>
        <p>
          Passive, geometry- or material-only source-control interventions do not
          provide reliable, scalable, or ethically defensible reduction in
          aerosol transmission risk in real-world settings. Effects are narrow,
          confounded, and prone to misinterpretation.
        </p>

        <p>
          Further investigation is appropriate only in tightly controlled
          research contexts. Public or policy-facing deployment is not justified.
        </p>

        <hr />

        <p>
          <strong>Note:</strong> This assessment was produced via structured
          reasoning by <em>Solace</em>, Moral Clarity AI’s evaluation system, and is
          published as a public reference.
        </p>

        <p className="text-sm text-muted-foreground">
          Version 1.0 · White Paper · Updated only by revision
        </p>
      </article>
    </main>
  );
}
