// app/edge-of-practice/pom-path-memory-bimodal-basin/page.tsx
// ============================================================
// EDGE OF PRACTICE — SHORT-CYCLE EXPERIMENT
// ============================================================
// Experiment: POM Path-Memory Bimodal Basin Test
// Scope: Polymer molecular invariants (path dependence + reversibility)
// Status: Canonical, fixed at publication
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "POM Path-Memory Bimodal Basin Test | Edge of Practice | Moral Clarity AI",
  description:
    "A short-cycle experiment testing whether thermally microcycled POM can occupy irreversible, mechanically indistinguishable but molecularly divergent internal states.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "POM Path-Memory Bimodal Basin Test",
    description:
      "Tests the collapse of path independence and reversibility assumptions in acetal (POM) under sub-visible thermal microhistory.",
    type: "article",
  },
};

export const dynamic = "force-static";

export default function POMPathMemoryBimodalBasinPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <header>
          <p className="text-sm uppercase tracking-wide text-neutral-400">
            Edge of Practice · Short-Cycle Experiment
          </p>
          <h1>POM Path-Memory Bimodal Basin Test</h1>
          <p className="text-lg text-neutral-400">
            Molecular path dependence and reset-resistant memory in acetal
            polymers under tensile-spec-compliant conditions
          </p>
        </header>

        <hr />

        <h2>Hidden Assumption</h2>
        <p>
          Path independence: polyoxymethylene (POM) parts that meet standard
          mechanical acceptance criteria are molecularly equivalent; prior
          thermal microhistory cannot create distinct, stable internal basins
          that alter functional behavior.
        </p>

        <h2>Why This Assumption Persists</h2>
        <p>
          ASTM and ISO qualification workflows treat tensile outcomes and visual
          inspection as sufficient proxies for material equivalence. Thermal
          microhistory is operationally difficult to track and is assumed to
          average out if parts remain within tensile tolerances and show no
          visible damage. Functional drift at low stress is rarely attributed to
          hidden molecular state when primary acceptance tests still pass.
        </p>

        <h2>Minimal Falsification Experiment</h2>
        <ol>
          <li>
            Mold <strong>60 POM tensile bars</strong> from a single production lot
            under identical processing conditions. Randomly assign into{" "}
            <strong>6 groups</strong> (n = 10 per group).
          </li>
          <li>
            Apply thermal history treatments:
            <ul>
              <li>
                Microcycle groups:{" "}
                <strong>0, 10, 50, 100, 300 cycles</strong> between 25 °C and
                140 °C, ~2 min dwell per step.
              </li>
              <li>
                Reference group: <strong>120 °C anneal × 24 h</strong>, slow cool.
              </li>
            </ul>
          </li>
          <li>
            Condition all samples identically for{" "}
            <strong>48 h at ambient laboratory conditions</strong>.
          </li>
          <li>
            <strong>Mechanical indistinguishability gate:</strong> tensile test
            5 bars per group.
            <ul>
              <li>Yield stress and UTS within ±3% of 0-cycle mean</li>
              <li>Modulus and elongation within ±5%</li>
              <li>No whitening, cracking, or necking anomalies</li>
            </ul>
            Any group failing this gate is excluded.
          </li>
          <li>
            <strong>Functional proxy — low-stress creep:</strong> on remaining 5
            bars per group, apply constant stress at 10–20% of baseline yield
            stress for 60 min at room temperature. Record strain at 5 min, 60
            min, unload, then record residual strain after 10 min recovery.
          </li>
          <li>
            <strong>Molecular proxy — DSC:</strong> run identical DSC programs on
            tested bars or matched coupons. Record crystallization temperature
            (Tc), crystallization enthalpy (cooling), and melting enthalpy
            (heating).
          </li>
          <li>
            <strong>Degradation discriminator:</strong> run oxidation induction
            time (DSC) or FTIR oxidation index on 0-cycle vs 300-cycle material to
            rule out simple oxidative aging.
          </li>
          <li>
            <strong>Reversibility (reset) test:</strong> select the first
            diverged microcycle group and the 0-cycle control. Apply standardized
            reset anneal (120 °C × 24 h, slow cool), condition 48 h, then repeat
            DSC and low-stress creep testing.
          </li>
        </ol>

        <h2>Primary Readout</h2>
        <p>
          Paired divergence in mechanically indistinguishable samples:
          <ul>
            <li>
              Emergence of bimodal or threshold-shifted Tc and/or crystallization
              enthalpy
            </li>
            <li>
              Discontinuous increase in low-stress creep compliance and residual
              strain
            </li>
            <li>
              Persistence or collapse of divergence after standardized reset
              anneal
            </li>
          </ul>
        </p>

        <h2>Pass / Fail Threshold</h2>
        <p>
          The assumption fails if any microcycle group:
          <ul>
            <li>Passes mechanical indistinguishability gates</li>
            <li>
              Shows ≥5 °C Tc separation or ≥10% enthalpy separation, including
              bimodality
            </li>
            <li>
              Shows ≥25% higher creep strain at 60 min or ≥2× residual strain
              after recovery vs 0-cycle group
            </li>
            <li>
              Retains ≥3 °C Tc or ≥1.5× residual creep divergence after reset
              anneal
            </li>
            <li>
              While oxidation metrics do not explain the divergence
            </li>
          </ul>
        </p>

        <h2>Embarrassing Flip Condition</h2>
        <p>
          Discovery of a sharp thermal microcycle threshold where POM remains
          tensile-spec compliant yet occupies a reset-resistant molecular basin
          forces revision of acceptance logic: thermal microhistory must be
          treated as a first-class state variable, and mechanical qualification
          alone can no longer certify interchangeability for dimensional
          stability or long-term performance.
        </p>

        <hr />

        <p className="text-sm text-neutral-400">
          This experiment is fixed at publication and revised only by explicit
          versioning to preserve epistemic continuity.
        </p>

        <p className="mt-6">
          <Link href="/edge-of-practice" className="no-underline">
            ← Back to Edge of Practice Index
          </Link>
        </p>
      </article>
    </main>
  );
}
