import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Air Ionizer Effects on Electrostatic Charge Buildup in Laboratory Electronics — Edge of Practice",
  description:
    "A controlled experiment testing whether air ionizers alter electrostatic charge accumulation on laboratory electronics.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AirIonizerElectrostaticChargePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Air Ionizer Effects on Electrostatic Charge Buildup in Laboratory Electronics</h1>

        <h2>Problem Statement</h2>
        <p>
          This experiment tests whether using an air ionizer affects
          electrostatic charge accumulation on laboratory electronics compared
          to conditions with no ionizer present. The objective is to determine
          whether an air ionizer introduces, reduces, or has no effect on static
          charge, potentially creating unintended electrostatic discharge (ESD)
          hazards.
        </p>

        <h2>Hidden Assumption Being Tested</h2>
        <p>
          Air ionizers neutralize static charge safely and do not increase
          electrostatic risk for nearby electronics.
        </p>

        <h2>What Might Be True Instead</h2>
        <p>
          Air ionizers may introduce spatial charge gradients or increase charge
          variability, raising ESD risk rather than reducing it.
        </p>

        <h2>Measurement Instruments</h2>
        <ul>
          <li>Desk air ionizer with adjustable output</li>
          <li>Three identical ESD-sensitive circuit boards or devices</li>
          <li>Non-contact electrostatic field meter (±1 V resolution)</li>
          <li>Static voltmeter probe (if available)</li>
          <li>Temperature and humidity monitor (±1% RH accuracy)</li>
          <li>Non-conductive mounting platform</li>
          <li>Insulated gloves</li>
          <li>Timer or stopwatch</li>
          <li>Data logging sheet or software</li>
        </ul>

        <h2>Environmental Controls</h2>
        <ul>
          <li>Temperature: 22 ± 2 °C</li>
          <li>Relative humidity: 40 ± 5%</li>
          <li>No external airflow or HVAC changes during testing</li>
          <li>All measurements conducted in the same room</li>
          <li>Minimized movement and electronic device usage nearby</li>
        </ul>

        <h2>Experimental Procedure</h2>

        <h3>1. Preparation</h3>
        <ol>
          <li>
            Place test boards on a non-conductive platform, spaced 10 cm apart.
          </li>
          <li>
            Allow the environment to stabilize for 30 minutes.
          </li>
          <li>
            Calibrate the electrostatic meter per manufacturer instructions.
          </li>
          <li>
            Wear insulated gloves when handling electronics.
          </li>
        </ol>

        <h3>2. Baseline (No Ionizer)</h3>
        <ol>
          <li>
            Ensure the air ionizer is OFF and unplugged.
          </li>
          <li>
            Leave boards undisturbed for 10 minutes.
          </li>
          <li>
            Measure surface voltage at three standard locations on each board.
          </li>
          <li>
            Repeat measurements every 5 minutes for a total of three readings
            (15 minutes).
          </li>
          <li>
            Record all voltages, temperature, and humidity.
          </li>
        </ol>

        <h3>3. Ionizer Active</h3>
        <ol>
          <li>
            Position the air ionizer 30 cm from the electronics, aligned with
            airflow direction.
          </li>
          <li>
            Power on the ionizer at manufacturer-recommended output.
          </li>
          <li>
            Allow 10 minutes for atmospheric equilibration.
          </li>
          <li>
            Repeat surface voltage measurements exactly as in the baseline
            condition.
          </li>
        </ol>

        <h2>Comparison Against Baseline</h2>
        <ul>
          <li>
            Calculate average static voltage per board for each condition.
          </li>
          <li>
            Record full distributions with environmental data.
          </li>
        </ul>

        <h2>Binary ESD-Risk Failure Definition</h2>
        <ul>
          <li>
            <strong>FAIL:</strong> Any measured surface voltage exceeds ±100 V at
            any point.
          </li>
          <li>
            <strong>FAIL:</strong> Average absolute voltage increases by ≥25%
            with ionizer ON compared to baseline.
          </li>
          <li>
            <strong>PASS:</strong> All voltages remain ≤±100 V and do not
            increase by ≥25%.
          </li>
        </ul>

        <h2>Reporting</h2>
        <p>
          Report mean, range, and standard deviation of all measured voltages for
          both baseline and ionizer-active conditions. The outcome is strictly
          binary.
        </p>

        <h2>Reproducibility Requirement</h2>
        <p>
          Repeat the entire procedure on three separate days. Results must be
          consistent across runs.
        </p>

        <h2>Scope Boundaries</h2>
        <p>
          This experiment makes no claims regarding health, compliance, product
          efficacy, or best practices. No extrapolation to other environments or
          devices is permitted.
        </p>

        <hr />

        <p className="text-sm text-muted-foreground">
          Edge-of-Practice experiments are designed for short-cycle execution,
          binary falsification, and direct laboratory reproducibility. No
          interpretation beyond stated thresholds is allowed.
        </p>

        {/* ========================================================= */}
        {/* BELOW THE EDGE — CONNECTIVITY-CONTROLLED ELECTROSTATIC RISK */}
        {/* ADDITIVE ONLY — NO REMOVALS                                */}
        {/* ========================================================= */}

        <hr />

        <h2>Below the Edge: Connectivity-Controlled Electrostatic Risk</h2>

        <h3>Frozen Assumption</h3>
        <p>
          System-wide electrostatic risk can be inferred from the mean voltage
          across board measurement nodes, presuming that no single node or set of
          strongly coupled nodes and edges can generate localized extremes that
          dominate the risk profile.
        </p>

        <h3>Structural Decomposition</h3>
        <p>
          Electrostatic charge behavior in ionized environments is spatially
          heterogeneous due to non-uniform ionizer plume structure, airflow
          boundaries, and surface geometry. Measurement nodes experience
          distinct local charge accumulation and dissipation timescales.
          Localized high-potential nodes may persist despite stable mean voltage
          across the network. When such nodes are linked by physical coupling
          pathways—defined by proximity, geometry, or airflow alignment—their
          interaction can dominate system-level risk.
        </p>

        <h3>Regime Boundary</h3>
        <p>
          The frozen assumption holds only while no edge connecting measurement
          nodes develops a potential difference (ΔV) exceeding its
          path-specific critical threshold. The regime boundary is crossed when
          one or more node-to-node couplings exhibit ΔV above threshold,
          independent of the mean node voltage.
        </p>

        <h3>Failure Signature</h3>
        <p>
          The abrupt emergence during a run of a high-ΔV edge or persistently
          elevated node voltage—directly observable in the measured dataset—
          while the average network voltage remains stable. This signature
          cannot be reconstructed from gradual or independent local variations.
        </p>

        <h3>Disentitlements</h3>
        <ul>
          <li>
            Electrostatic risk cannot be inferred from mean voltage or average
            ion neutralization.
          </li>
          <li>
            Claims of uniform charge control via ionization are invalid.
          </li>
          <li>
            Any safety model excluding node–edge extremes and coupling geometry
            is epistemically unsound.
          </li>
        </ul>

        <h3>Corrected Interpretation</h3>
        <p>
          Electrostatic risk is governed by the presence and connectivity of
          nodes and edges exhibiting extreme voltage or edge ΔV within the
          measurement network. These localized extremes—not global averages—
          control the possibility of abrupt, system-relevant electrostatic
          hazards.
        </p>
      </article>
    </main>
  );
}
