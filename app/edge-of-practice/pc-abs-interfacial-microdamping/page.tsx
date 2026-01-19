// app/edge-of-practice/pc-abs-interfacial-microdamping/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Edge of Practice — Interfacial Micro-Damping in PC/ABS Bilayers | Moral Clarity AI",
  description:
    "A short-cycle experiment testing whether mechanically layered polycarbonate and ABS exhibit interface-driven micro-damping and improved fatigue resistance under cyclic loading.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PCABSInterfacialMicroDampingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          Interfacial Micro-Damping in Mechanically Layered Polycarbonate and ABS
        </h1>

        <h2>Civilizational assumption under test</h2>
        <p>
          Mechanical durability and fatigue resistance in polycarbonate/ABS
          systems are governed primarily by bulk blending ratios and chemical
          compatibilization, rather than by physical interface structure.
        </p>

        <h2>Why this assumption is load-bearing</h2>
        <p>
          Polycarbonate/ABS systems are widely used in automotive interiors,
          consumer electronics housings, safety equipment, and structural
          enclosures. Design decisions emphasize blend optimization for impact
          toughness and processability, with fatigue performance treated as a
          secondary bulk property.
        </p>

        <p>
          If interface-driven mechanical dissipation is ignored, designers are
          constrained to chemistry-based solutions that increase cost, reduce
          recyclability, and complicate long-term durability prediction.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Fabricate mechanically layered, unblended bilayer specimens consisting
          of polycarbonate bonded directly to acrylonitrile butadiene styrene.
          No chemical compatibilizers, adhesives, or fillers are permitted.
        </p>

        <p>
          Bonding may be achieved by co-extrusion, thermal pressing, or
          controlled melt fusion sufficient to prevent immediate delamination
          under handling.
        </p>

        <h2>Hypothesis</h2>
        <p>
          The compliance mismatch between polycarbonate and ABS generates
          controlled interfacial micro-damping under cyclic mechanical loading.
          This interface dissipates mechanical energy, slowing fatigue crack
          initiation and propagation relative to either material alone.
        </p>

        <h2>Minimal test protocol</h2>
        <ul>
          <li>
            <strong>Specimen:</strong> Laminated bilayer sheet (e.g., 1 mm PC +
            1 mm ABS)
          </li>
          <li>
            <strong>Control samples:</strong> Monolithic PC and monolithic ABS
            sheets of equal thickness
          </li>
          <li>
            <strong>Mechanical loading:</strong> Cyclic three-point bend fatigue
            (≥10⁵ cycles at moderate amplitude)
          </li>
          <li>
            <strong>Duration:</strong> Continuous or intermittent cycling over
            one week
          </li>
          <li>
            <strong>Measurements:</strong> Crack initiation, crack propagation
            rate, interfacial integrity, and energy dissipation via DMA
          </li>
        </ul>

        <h2>Failure condition</h2>
        <p>
          The assumption fails if any of the following are observed:
        </p>
        <ul>
          <li>Visible interfacial delamination prior to fatigue failure</li>
          <li>
            Through-thickness crack propagation occurring in fewer cycles than
            either neat PC or neat ABS
          </li>
          <li>
            No measurable increase in mechanical energy dissipation relative to
            monolithic controls
          </li>
        </ul>

        <h2>What breaks if this assumption is false</h2>
        <p>
          Mechanical interface effects remain secondary to bulk composition,
          reinforcing reliance on chemical compatibilization and blend tuning
          for fatigue resistance.
        </p>

        <h2>What breaks if this assumption is true</h2>
        <p>
          A purely physical pathway for improving fatigue resistance through
          mechanical layering becomes viable, challenging blend-centric design
          paradigms and opening new approaches to durability without chemistry
          changes.
        </p>

        <hr />

        <p>
          <em>Status:</em> Final · Immutable
        </p>
      </article>
    </main>
  );
}
