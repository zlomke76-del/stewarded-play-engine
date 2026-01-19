import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "HDPE Pipe Extrusion — Die-Entrance Viscosity Stability and Melt Fracture Risk | Moral Clarity AI",
  description:
    "A short-cycle falsification experiment testing whether HDPE melt viscosity at the die entrance remains sufficient to prevent gross melt fracture under fixed extrusion conditions.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function HDPEDieEntranceViscosityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          HDPE Pipe Extrusion — Die-Entrance Viscosity Stability and Melt Fracture
          Risk
        </h1>

        <p className="lead">
          <strong>
            A minimal falsification of a tolerated rheological assumption in
            continuous HDPE pipe extrusion
          </strong>
        </p>

        <hr />

        <h2>Polymer and Processing Step</h2>

        <p>
          <strong>Polymer:</strong> High-density polyethylene (HDPE), bimodal
          pipe-grade resin
        </p>

        <p>
          <strong>Process:</strong> Single-screw pipe extrusion
        </p>

        <h2>The Smallest Physical Assumption</h2>

        <p>
          The melt viscosity of HDPE at the die entrance remains sufficiently high
          throughout the extrusion run to keep wall shear stress below the
          critical threshold for gross melt fracture, allowing fixed screw speed
          and temperature settings to reliably produce smooth pipe surfaces.
        </p>

        <h2>Why Industry Tolerates This Assumption</h2>

        <p>
          Pipe extrusion lines operate continuously at fixed screw speeds
          (typically 50–100 rpm) to maintain stable output rates of 300–1200 kg/h.
          Die temperature and back pressure are set during startup based on
          historical performance and are rarely adjusted mid-run.
        </p>

        <p>
          Real-time viscosity monitoring at the die entrance requires specialized
          hardware and interrupts production flow. Surface quality is therefore
          assessed visually or by touch after calibration, and minor surface
          defects such as sharkskin are tolerated when they do not affect
          pressure rating or dimensional certification.
        </p>

        <h2>Minimal Falsification Experiment</h2>

        <p>
          <strong>Setup:</strong>
        </p>

        <ul>
          <li>
            Extrude 110 mm OD SDR 11 HDPE pipe under standard conditions: melt
            temperature 200 °C, screw speed 60 rpm, line speed 15 m/min.
          </li>
          <li>
            After steady state is achieved, collect melt samples from the die
            entrance using a retractable melt probe at 30, 60, and 90 minutes.
          </li>
          <li>
            Measure zero-shear viscosity (η₀) for each sample using a rotational
            rheometer (25 mm parallel-plate geometry, 190 °C, frequency sweep
            0.01–100 rad/s).
          </li>
        </ul>

        <p>
          <strong>Primary Readout:</strong> Zero-shear viscosity η₀ (Pa·s) at the
          die entrance.
        </p>

        <p>
          <strong>Pass:</strong> All measured η₀ values ≥ 1500 Pa·s.
        </p>

        <p>
          <strong>Fail:</strong> Any sample shows η₀ ≤ 1200 Pa·s, indicating
          viscosity loss sufficient to permit gross melt fracture under fixed
          process settings.
        </p>

        <h2>Embarrassing Flip Condition</h2>

        <p>
          If all three melt samples show zero-shear viscosity η₀ ≥ 1500 Pa·s over
          the full 90-minute run, despite continuous operation at fixed settings,
          the premise that viscosity degradation poses a credible melt fracture
          risk under standard conditions is invalidated.
        </p>

        <h2>Corrected Interpretation If the Flip Occurs</h2>

        <p>
          Melt viscosity at the die entrance remains sufficiently stable during
          routine HDPE pipe extrusion to keep wall shear stress below the
          fracture threshold, confirming that fixed process parameters are
          adequate to prevent gross melt fracture under standard operating
          practice.
        </p>

        <hr />

        <h2>Methodological Note</h2>

        <p>
          This experiment was independently derived using multiple large language
          model systems and reconciled through a structured editorial process to
          test convergence under Edge of Practice constraints. Measurement
          methods, thresholds, and falsification criteria were not altered during
          reconciliation.
        </p>

        <p className="text-sm text-muted-foreground">
          Inclusion in the Edge of Practice index does not imply generalization
          beyond the tested assumption.
        </p>
      </article>
    </main>
  );
}
