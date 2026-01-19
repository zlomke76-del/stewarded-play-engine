// app/edge-of-practice/tpu-segmental-network-decoupling/page.tsx
// ============================================================
// EDGE OF PRACTICE — SHORT-CYCLE EXPERIMENT
// ============================================================
// Experiment: TPU Segmental Network Decoupling Test
// Scope: Polymer molecular invariants (property separability)
// Status: Canonical, fixed at publication
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "TPU Segmental Network Decoupling Test | Edge of Practice | Moral Clarity AI",
  description:
    "A short-cycle experiment testing whether mechanically indistinguishable TPU parts can silently diverge in transport behavior due to reset-resistant segmental network reconfiguration.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "TPU Segmental Network Decoupling Test",
    description:
      "Tests the collapse of property separability in thermoplastic polyurethane under mechanically invisible segmental reconfiguration.",
    type: "article",
  },
};

export const dynamic = "force-static";

export default function TPUSegmentalNetworkDecouplingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <header>
          <p className="text-sm uppercase tracking-wide text-neutral-400">
            Edge of Practice · Short-Cycle Experiment
          </p>
          <h1>TPU Segmental Network Decoupling Test</h1>
          <p className="text-lg text-neutral-400">
            Mechanical equivalence masking reset-resistant segmental
            reconfiguration and barrier divergence in thermoplastic polyurethane
          </p>
        </header>

        <hr />

        <h2>Hidden Assumption</h2>
        <p>
          Separability: in thermoplastic polyurethane (TPU), passing mechanical
          acceptance tests (tensile strength, modulus, elongation) certifies
          equivalence of transport and barrier performance; segmental hydrogen
          bond network rearrangement cannot induce substantial permeability
          changes without corresponding mechanical signature.
        </p>

        <h2>Why This Assumption Persists</h2>
        <p>
          Industry acceptance practices privilege tensile and abrasion metrics
          because they are fast, standardized, and user-visible. Segmental
          hydrogen bonding and soft–hard domain topology are presumed to track
          mechanical integrity, not functional barrier behavior. Once mechanical
          specification is met, permeability is rarely re-verified, reinforcing
          the presumption that mechanical and transport states are inseparable.
        </p>

        <h2>Minimal Falsification Experiment</h2>

        <h3>Material</h3>
        <ul>
          <li>
            Single production lot of <strong>ether-based TPU</strong> film or
            plaque (no fillers, blends, or plasticizers; batch verified)
          </li>
          <li>
            Prepare <strong>50 identical, standardized specimens</strong>
          </li>
        </ul>

        <h3>Condition History Induction</h3>
        <p>Divide specimens into five groups (n = 10):</p>
        <ul>
          <li>
            <strong>Group A:</strong> No treatment (baseline control)
          </li>
          <li>
            <strong>Group B:</strong> Moderate humidity soak (75% RH, 72 h)
          </li>
          <li>
            <strong>Group C:</strong> Cyclic humidity (25% ↔ 75% RH, 12 h per
            step, 6 cycles)
          </li>
          <li>
            <strong>Group D:</strong> Static sub-yield tensile pre-strain (15% of
            yield, held 24 h, then unloaded)
          </li>
          <li>
            <strong>Group E:</strong> Combined humidity cycling (as Group C) +
            sub-yield pre-strain (as Group D), synchronized
          </li>
        </ul>
        <p>
          No group may exceed yield or display any visible deformation. All
          groups equilibrate <strong>48 h at 25 °C, 50% RH</strong> before
          testing.
        </p>

        <h3>Mechanical Indistinguishability Gate</h3>
        <p>Test 5 specimens per group. Require:</p>
        <ul>
          <li>Yield strength and UTS within ±3% of control mean</li>
          <li>Modulus and elongation within ±5%</li>
          <li>No whitening, cracking, or necking</li>
        </ul>
        <p>
          Groups failing any criterion are excluded from further analysis; only
          mechanically indistinguishable sets advance.
        </p>

        <h3>Functional Proxy — Barrier / Transport</h3>
        <p>
          On remaining 5 specimens per group, measure{" "}
          <strong>WVTR or OTR</strong> using the same fixture, randomized order,
          under standardized test conditions.
        </p>

        <h3>Molecular Proxy — Segmental State</h3>
        <p>
          Run <strong>DMA temperature sweep</strong> on matched specimens. Record
          tan&nbsp;δ peak position and width in the soft-segment T<sub>g</sub>{" "}
          region.
        </p>

        <h3>Reversibility Strike (Post-Divergence)</h3>
        <p>
          For any group showing barrier or molecular divergence, apply reset
          anneal:
        </p>
        <ul>
          <li>
            <strong>80 °C × 24 h</strong>, dry air, no load
          </li>
          <li>
            Re-equilibrate <strong>48 h at 25 °C, 50% RH</strong>
          </li>
          <li>Repeat permeability and DMA testing</li>
        </ul>

        <h2>Primary Readout</h2>
        <ul>
          <li>
            Discontinuous or threshold shift in transport (≥30% change in
            WVTR/OTR or non-monotonic jump)
          </li>
          <li>
            Accompanied by ≥5 °C tan&nbsp;δ shift or ≥20% peak broadening (DMA)
          </li>
          <li>All while mechanical parameters remain matched to control</li>
        </ul>

        <h2>Pass / Fail Threshold</h2>
        <p>The assumption fails if any treatment group:</p>
        <ul>
          <li>Passes the mechanical indistinguishability gate</li>
          <li>
            Shows ≥30% transport property change (WVTR/OTR) versus control
          </li>
          <li>
            Shows ≥5 °C shift or ≥20% broadening of tan&nbsp;δ in the
            soft-segment region
          </li>
          <li>
            Retains divergence after standardized reset anneal
          </li>
        </ul>

        <h2>Embarrassing Flip Condition</h2>
        <p>
          Discovery that TPU remains fully within mechanical specification while
          undergoing reset-resistant segmental network reconfiguration that
          silently alters barrier functionality directly falsifies separability.
          Mechanical testing alone is disqualified as a proxy for environmental,
          chemical, or transport equivalence.
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
