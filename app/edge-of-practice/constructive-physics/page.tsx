// app/edge-of-practice/constructive-physics/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Constructive Physics — Latent Energy & Interface Mechanisms | Moral Clarity AI",
  description:
    "A focused index of constructive, positive-sum physics experiments that extract usable energy and function from underexploited physical regimes such as turbulence, resonance, and thermal gradients.",
  openGraph: {
    title: "Constructive Physics — Where Reality Still Has Gifts to Give",
    description:
      "Short-cycle experiments uncovering overlooked physical mechanisms for energy, water, and environmental systems.",
    url: "https://moralclarity.ai/edge-of-practice/constructive-physics",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ConstructivePhysicsIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Constructive Physics</h1>

        <p className="lead">
          <strong>
            Where physics still has gifts left to give
          </strong>
        </p>

        <p>
          This index collects <em>constructive</em>, positive-sum experiments that
          reveal underexploited physical mechanisms capable of increasing energy,
          water, or environmental performance without behavioral change,
          regulation, or centralized control.
        </p>

        <p>
          These works do not begin from failure, risk, or constraint. They begin
          from the premise that many natural systems still contain accessible,
          unused structure—particularly at interfaces, in turbulent regimes, and
          within resonant dynamics—that conventional engineering ignores.
        </p>

        <hr />

        <h2>Defining Characteristics</h2>

        <ul>
          <li>Constructive, not corrective</li>
          <li>Interface- and gradient-driven</li>
          <li>Binary, falsifiable experiments</li>
          <li>No turbines, batteries, or centralized control required</li>
          <li>Designed for passive or low-maintenance deployment</li>
        </ul>

        <hr />

        <h2>Founding Experiments</h2>

        <ul>
          <li>
            <Link href="/edge-of-practice/constructive-physics/boundary-layer-vorticity-harvesting">
              Boundary-Layer Vorticity Harvesting for Turbine-Free Wind Energy
            </Link>
            <br />
            <span className="text-sm text-muted-foreground">
              Harvests rotational kinetic energy from turbulent boundary layers
              using compliant oscillators instead of bulk-flow turbines
            </span>
          </li>

          <li>
            <Link href="/edge-of-practice/constructive-physics/phase-locked-aeroelastic-resonance">
              Phase-Locked Aeroelastic Resonant Harvesting
            </Link>
            <br />
            <span className="text-sm text-muted-foreground">
              Exploits stable aeroelastic resonance windows to extract energy from
              low-velocity winds without rotational machinery
            </span>
          </li>

          <li>
            <Link href="/edge-of-practice/constructive-physics/thermal-wind-rectification">
              Thermal–Wind Coupled Rectification for Directional Work
            </Link>
            <br />
            <span className="text-sm text-muted-foreground">
              Converts diurnal thermal gradients and stochastic wind into
              consistent mechanical or electrical output
            </span>
          </li>
        </ul>

        <hr />

        <h2>Relation to Edge of Practice</h2>

        <p>
          <em>Constructive Physics</em> is a specialized branch within{" "}
          <Link href="/edge-of-practice">Edge of Practice</Link>. Where much of
          Edge of Practice identifies irreversibility and failure boundaries,
          this section focuses on mechanisms that <em>increase capability</em>
          by aligning engineering with overlooked physical structure.
        </p>

        <p className="text-sm text-muted-foreground">
          All experiments are fixed at publication. Revisions occur only through
          explicit versioning to preserve epistemic continuity.
        </p>
      </article>
    </main>
  );
}
