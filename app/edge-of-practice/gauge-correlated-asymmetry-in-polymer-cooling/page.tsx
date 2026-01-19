import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Gauge-Correlated Asymmetry in Polymer Cooling | Edge of Practice — Moral Clarity AI",
  description:
    "A steward-grade falsification protocol exposing tolerated cooling symmetry assumptions by correlating reproducible thermal asymmetry with downstream product defects.",
  openGraph: {
    title: "Gauge-Correlated Asymmetry in Polymer Cooling",
    description:
      "A plant-ready falsification protocol closing deniability around cooling symmetry assumptions in injection molding.",
    url: "https://studio.moralclarity.ai/edge-of-practice/gauge-correlated-asymmetry-in-polymer-cooling",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GaugeCorrelatedAsymmetryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Gauge-Correlated Asymmetry in Polymer Cooling</h1>
        <p className="text-sm opacity-70">
          Edge of Practice · Steward’s Falsification Protocol
        </p>

        <h2>One-Sentence Assumption Under Test</h2>
        <p>
          Standard injection molding cooling times are sufficient to suppress
          internal thermal asymmetry such that no reproducible downstream defect
          emerges in finished polypropylene parts under nominal process
          conditions.
        </p>

        <h2>Why This Assumption Is Tolerated</h2>
        <p>
          Fixed cooling times simplify cycle design and maximize throughput.
          Internal thermal gradients are difficult to observe directly without
          intrusive instrumentation, and downstream inspection often averages
          cooling-driven effects such as warpage, sink, or shrink within
          tolerance limits. Low rejection rates are treated as confirmation,
          allowing the assumption to persist without direct falsification.
        </p>

        <h2>Minimal Plant-Ready Falsification Experiment</h2>

        <h3>Setup</h3>
        <ul>
          <li>
            Mold a standard polypropylene part (approximately 4&nbsp;mm nominal
            wall thickness) at steady state.
          </li>
          <li>
            Hold all parameters constant: material lot, melt temperature, mold
            temperature, packing profile, and ejection timing.
          </li>
          <li>
            Run three cooling-time conditions:
            <ul>
              <li>Nominal production cooling time</li>
              <li>Nominal minus 20 percent</li>
              <li>Nominal plus 20 percent</li>
            </ul>
          </li>
          <li>Produce 30 parts per condition.</li>
        </ul>

        <p>
          No invasive sensors, mold modifications, or proprietary instrumentation
          are required.
        </p>

        <h2>Single Primary Readout</h2>
        <p>
          Select one downstream artifact metric appropriate to the part geometry
          and use it consistently across all conditions:
        </p>
        <ul>
          <li>Warpage magnitude and direction at fixed datums</li>
          <li>Sink depth at a defined rib or boss</li>
          <li>Shrink differential along flow versus transverse direction</li>
          <li>
            Optical haze or crystallinity banding under fixed lighting conditions
          </li>
        </ul>

        <h2>Pass / Fail Criteria</h2>
        <p>
          <strong>Pass:</strong> The artifact metric remains within specification
          and shows no systematic trend across cooling-time variation.
        </p>
        <p>
          <strong>Fail:</strong> A reproducible defect signature appears at
          nominal cooling time and shifts predictably with reduced or increased
          cooling time.
        </p>
        <p>
          <strong>Flag for review:</strong> Persistent but sub-threshold artifact
          signatures appear without clear monotonic trend, indicating potential
          emerging asymmetry requiring further investigation.
        </p>

        <h2>Embarrassing Flip Condition</h2>
        <p>
          A consistent warpage vector, sink location, or banding pattern appears
          at nominal settings and improves or worsens monotonically as cooling
          time is increased or decreased.
        </p>

        <p>
          If this condition is documented, the associated symmetry assumption
          loses its operational exemption and must be formally addressed through
          documented process adjustment, tooling modification, or control
          strategy revision.
        </p>

        <h2>Protocol Safeguards and Artifact Controls</h2>
        <ul>
          <li>
            <strong>Numeric gate validation:</strong> Thresholds reflect
            representative polypropylene injection molding conditions and must
            be empirically validated for material grade, geometry, and equipment.
          </li>
          <li>
            <strong>Reference frame verification:</strong> Physical datums and
            measurement reference points must be verified and logged prior to
            each run.
          </li>
          <li>
            <strong>Reproducibility requirement:</strong> Artifact signatures
            must persist across multiple parts within the same cooling-time
            condition.
          </li>
        </ul>

        <h2>Corrected Interpretation if Flip Occurs</h2>
        <p>
          The nominal cooling time does not sufficiently eliminate internal
          thermal asymmetry. The assumption of uniform solidification is
          operationally invalid for process control purposes, and downstream
          defects are being tolerated rather than prevented.
        </p>

        <h2>Steward’s Note</h2>
        <p>
          This experiment does not aim to demonstrate the existence of internal
          thermal gradients. That fact is already established. Its purpose is to
          determine whether the selected cooling time suppresses those gradients
          below the threshold of operational consequence.
        </p>

        <p>
          By correlating asymmetry with a product artifact the plant already
          measures, the protocol removes plausible deniability while remaining
          executable with standard production tools.
        </p>

        <h2>Canonical Principle</h2>
        <blockquote>
          <p>
            <strong>Gauge-Correlated Asymmetry Clause:</strong> A symmetry claim
            that cannot withstand reproducible, product-correlated asymmetric
            signatures is operationally void for process control purposes.
          </p>
        </blockquote>

        <hr />

        <p className="text-sm opacity-70">
          Part of the{" "}
          <Link href="/edge-of-practice">
            Edge of Practice short-cycle experiment index
          </Link>
          .
        </p>
      </article>
    </main>
  );
}
