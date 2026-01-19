import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Edge of Practice — Embedded Osmotic Power from Waste Salinity Gradients | Moral Clarity AI",
  description:
    "A short-cycle, falsifiable experiment testing whether incidental salinity gradients in existing water infrastructure can be exploited as continuous, embedded energy sources using reverse electrodialysis.",
  openGraph: {
    title: "Embedded Osmotic Power from Waste Salinity Gradients",
    description:
      "A governed Edge of Practice experiment testing embedded osmotic energy harvesting under real-world salinity gradients.",
    url: "https://moralclarity.ai/edge-of-practice/embedded-osmotic-power",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EmbeddedOsmoticPowerPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Embedded Osmotic Power from Waste Salinity Gradients</h1>

        <p className="lead">
          <strong>
            A short-cycle Edge of Practice experiment testing whether incidental
            salinity gradients can be exploited as embedded energy sources.
          </strong>
        </p>

        <hr />

        <h2>A) System Definition (Fixed)</h2>

        <p>
          A passive reverse electrodialysis device embedded within existing water
          infrastructure harvests electrical energy from persistent, real-world
          salinity gradients under continuous flow. No energy storage, external
          power, pressurization, or active control is present or permitted.
        </p>

        <hr />

        <h2>B) Assumption Under Test</h2>

        <p>
          <strong>
            Incidental salinity gradients present in routine water flows cannot
            be practically exploited for continuous, embedded energy generation
            using currently available membrane technology.
          </strong>
        </p>

        <p>
          This assumption is widely held across energy, water, and materials
          practice and is rarely examined outside grid-scale or dedicated
          pilot-plant contexts.
        </p>

        <hr />

        <h2>C) Canonical Structure and Constraints</h2>

        <h3>1. Symmetry Group (𝑮)</h3>

        <ul>
          <li>Spatial translation along a steady salinity interface</li>
          <li>Temporal translation under uninterrupted flow</li>
          <li>Electrical load variation at fixed membrane area</li>
          <li>
            Parallel operation that does not alter the primary function,
            compliance, or integrity of the host water system
          </li>
        </ul>

        <p>
          No invariance is claimed with respect to scale, economics, or grid
          integration.
        </p>

        <h3>2. Conserved Quantity (𝑸)</h3>

        <p>
          The sole energetic input is the electrochemical potential difference
          (Δμ) between real salinity streams.
        </p>

        <p>
          No auxiliary energy, dynamic control, or buffering is allowed.
        </p>

        <h3>3. Invariant Spectrum (𝑺)</h3>

        <ul>
          <li>Instantaneous power density (W/m² membrane area)</li>
          <li>
            Voltage stability under fixed salinity gradient and flow
          </li>
          <li>
            Stepwise fouling onset (categorical discontinuities only)
          </li>
          <li>
            Maintenance requirement (binary: intervention required / not
            required)
          </li>
        </ul>

        <p>
          Averages, projections, normalization, or trend-based metrics are
          explicitly excluded.
        </p>

        <h3>4. Failure Signatures (Categorical)</h3>

        <p>The system fails if any of the following occur:</p>

        <ul>
          <li>Power output collapses below measurement noise floor</li>
          <li>
            Voltage decays irreversibly under constant salinity gradient
          </li>
          <li>
            A single step-change fouling event requires active maintenance
          </li>
          <li>
            External energy input is required to sustain output
          </li>
        </ul>

        <p>
          Gradual decline, partial performance, or marginal gains do not
          constitute success.
        </p>

        <hr />

        <h2>D) Structural Origin of the Assumption</h2>

        <ul>
          <li>Energy systems prioritize peak, dispatchable capacity</li>
          <li>
            Water systems prioritize regulatory compliance and continuity
          </li>
          <li>
            Membrane technologies are evaluated under idealized laboratory
            conditions
          </li>
          <li>
            Small, localized energy yields are dismissed by centralized
            economic metrics
          </li>
        </ul>

        <p>
          As a result, salinity gradients are treated as waste or risk rather
          than conserved energy differentials.
        </p>

        <hr />

        <h2>E) Minimal Viable Test Protocol</h2>

        <ul>
          <li>
            Assemble a 1 m² reverse electrodialysis stack using commercial
            ion-exchange membranes
          </li>
          <li>
            Deploy across a real salinity interface (e.g., irrigation tailwater,
            wastewater effluent) with coarse filtration only
          </li>
          <li>
            Maintain unaltered flow; no fouling mitigation or active control
          </li>
          <li>Operate continuously for 14–30 days</li>
          <li>
            Measure only:
            <ul>
              <li>Instantaneous power density</li>
              <li>Voltage stability</li>
              <li>Time and nature of any stepwise failure</li>
              <li>Binary maintenance requirement</li>
            </ul>
          </li>
        </ul>

        <p>No additional measurements are admissible.</p>

        <hr />

        <h2>F) Explicit Non-Claims</h2>

        <ul>
          <li>Grid contribution or replacement</li>
          <li>Economic viability</li>
          <li>Parity with other renewables</li>
          <li>Long-term durability</li>
          <li>Membrane optimization pathways</li>
          <li>Climate or policy impact</li>
        </ul>

        <p>
          Introduction of any such claims invalidates the result.
        </p>

        <hr />

        <h2>G) Bounded Risk Profile</h2>

        <ul>
          <li>
            Worst-case outcome: a passive filter with no net energy output
          </li>
          <li>No safety, financial, or systemic hazards</li>
          <li>
            Failure is recorded as a null result, not an error
          </li>
        </ul>

        <hr />

        <h2>H) Edge Classification</h2>

        <p>
          This experiment probes a categorical framing error: centralized power
          evaluation criteria are improperly applied to embedded, non-competitive
          gradient conversion systems.
        </p>

        <p>
          The outcome is binary. Incremental benefit is excluded by design.
        </p>

        <hr />

        <h2>I) Arbitration Instructions for Solace</h2>

        <ul>
          <li>Hold the assumption exactly as written</li>
          <li>Reject proxy metrics, averages, and optimization proposals</li>
          <li>Enforce binary pass/fail logic only</li>
          <li>
            Permit refusal or silence if invariant structure is violated
          </li>
          <li>
            Refrain from recommending deployment, scaling, or further engineering
          </li>
        </ul>

        <p>
          Solace’s role is enforcement, not interpretation.
        </p>

        <hr />

        <h2>J) Closure Rule</h2>

        <p>
          <strong>If any failure signature occurs:</strong> publish failure,
          assumption upheld, archive.
        </p>

        <p>
          <strong>If no failure signature occurs:</strong> publish only that the
          assumption does not hold. No extrapolation is permitted. Further work
          requires a new, separately framed entry.
        </p>

        <hr />

        <p className="text-sm text-muted-foreground">
          This entry is governed by the{" "}
          <Link href="/edge-of-practice/canon">
            Edge Canon: Invariants, Not Interpretations
          </Link>
          . Interpretation is fixed at publication.
        </p>
      </article>
    </main>
  );
}
