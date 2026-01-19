import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — Microplastics | Moral Clarity AI",
  description:
    "A civilization-scale assumption stress test examining whether microplastics are chemically inert in natural environments.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function MicroplasticsEdgePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Microplastics as Dynamic Chemical Agents</h1>

        <h2>Civilizational assumption under test</h2>
        <p>
          Microplastics are chemically inert: their long-term presence in water
          and sediment does not alter surrounding environmental chemistry.
        </p>

        <h2>Why this assumption is load-bearing</h2>
        <p>
          Global environmental policy, waste management systems, food safety
          protocols, and water treatment strategies operate on the premise that
          microplastics are passive physical contaminants. These frameworks focus
          on containment, filtration, or removal of visible debris, assuming
          chemical stasis once plastics enter environmental systems.
        </p>

        <p>
          This assumption underpins pollutant classification schemes, exposure
          modeling, remediation priorities, and institutional confidence that
          microplastics do not introduce ongoing chemical pathways into
          ecosystems, food chains, or water supplies beyond their physical
          presence.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Prepare identical containers filled with unfiltered natural water and
          sediment from a single source. Introduce a{" "}
          <strong>consistent quantity</strong> of clean, commercially available
          microplastic particles into half of the containers; maintain the
          remainder as particle-free controls.
        </p>

        <p>
          Place all containers in a stable, shaded outdoor environment for ninety
          days, exposed only to ambient temperature variation and natural light
          cycles.
        </p>

        <p>
          At weekly intervals, assess containers using non-instrumented,
          field-ready methods such as colorimetric water chemistry strips and
          droplet tests, observing:
        </p>

        <ul>
          <li>Changes in pH</li>
          <li>Visible shifts in dissolved organic matter (color or turbidity)</li>
          <li>Alterations in oxidation–reduction indicators</li>
        </ul>

        <h2>Failure condition</h2>
        <p>
          A <strong>persistent and reproducible divergence in any single chemical
          indicator</strong>, present only in microplastic-containing containers
          and <strong>persisting across at least three consecutive observation
          intervals</strong>, constitutes failure of the assumption.
        </p>

        <h2>What breaks if this assumption is false</h2>
        <p>
          Waste management models based on physical containment or removal of
          plastics become insufficient, leaving active chemical pathways
          unaddressed. Environmental monitoring systems focused on debris
          presence fail to detect ongoing chemical transformation.
        </p>

        <p>
          Food safety and water quality frameworks misjudge exposure and toxicity
          by treating microplastics as inert carriers rather than chemically
          active agents. Regulatory standards and remediation priorities must be
          rewritten to account for microplastics as dynamic chemical
          participants.
        </p>

        <hr />
        <p>
          <em>Status:</em> Final · Immutable
        </p>
      </article>
    </main>
  );
}
