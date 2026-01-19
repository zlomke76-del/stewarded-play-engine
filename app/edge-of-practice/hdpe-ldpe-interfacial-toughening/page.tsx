import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — HDPE/LDPE Interfacial Toughening | Moral Clarity AI",
  description:
    "Tests whether dispersed LDPE domains in HDPE improve mechanical toughness through interfacial morphology rather than chemistry.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function HDPELDPEInterfacialTougheningPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Interfacial Toughening in HDPE via Dispersed LDPE Domains</h1>

        <h2>Assumption under test</h2>
        <p>
          Blending chemically similar polyethylenes produces only averaged
          mechanical properties and cannot meaningfully increase toughness
          without additives, compatibilizers, or chemistry.
        </p>

        <h2>Why this assumption is load-bearing</h2>
        <p>
          High-density polyethylene is widely used in structural and impact-prone
          applications where toughness limits performance. Industry typically
          addresses brittleness through additives, copolymers, or geometry
          changes rather than exploiting morphology within commodity blends.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Melt-extrude high-density polyethylene blended with 10–30 wt% low-density
          polyethylene using standard twin-screw processing. Form test specimens
          by compression molding or injection molding without compatibilizers or
          post-treatment.
        </p>

        <p>
          The hypothesis is that LDPE forms dispersed, deformable domains within
          the HDPE matrix, acting as localized energy-absorbing inclusions.
          Toughness enhancement arises from interfacial slippage and altered
          fracture pathways—not from chemistry or modulus reduction.
        </p>

        <h2>Primary measurements</h2>
        <ul>
          <li>Tensile testing with toughness (area under stress–strain curve)</li>
          <li>Instrumented impact testing versus neat HDPE</li>
          <li>Immediate fracture surface inspection after testing</li>
        </ul>

        <h2>Failure condition</h2>
        <p>
          No measurable increase in tensile toughness or impact energy compared
          to neat HDPE, or evidence of macroscopic phase separation or rapid
          domain coarsening within 72 hours.
        </p>

        <h2>Pass condition</h2>
        <p>
          A ≥20% increase in tensile toughness or impact energy relative to neat
          HDPE, with stable morphology and no visible phase separation.
        </p>

        <h2>What breaks if this assumption is false</h2>
        <p>
          If the assumption fails, commodity polyolefin blends can be deliberately
          structured to enhance mechanical performance using morphology alone.
          This reframes LDPE not as a cost or processing modifier, but as a
          controllable mechanical energy dissipation phase.
        </p>

        <hr />
        <p>
          <em>Status:</em> Final · Immutable
        </p>
      </article>
    </main>
  );
}
