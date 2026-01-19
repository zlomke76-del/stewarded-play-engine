import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — Thermal Buffering in Polyethylene Films | Moral Clarity AI",
  description:
    "A short-cycle experiment testing whether confined paraffin wax enables passive thermal buffering in commodity polyethylene films without leakage or chemical modification.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PEThermalBufferingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Passive Thermal Buffering in Polyethylene Films</h1>

        <h2>Civilizational assumption under test</h2>
        <p>
          Commodity polyethylene films are thermally passive barriers and cannot
          meaningfully moderate temperature spikes without encapsulated phase
          change materials, chemical modification, or multilayer composites.
        </p>

        <h2>Why this assumption is load-bearing</h2>
        <p>
          Food packaging, medical transport, cold-chain logistics, and consumer
          goods protection all assume polyethylene films transmit ambient heat
          changes essentially unchanged. As a result, thermal buffering is
          delegated to foams, gels, or discrete PCM inserts—adding cost,
          complexity, and waste.
        </p>

        <p>
          If polyethylene itself can moderate temperature rise rates using only
          physically confined additives, large portions of thermal management
          infrastructure could be simplified or eliminated.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Introduce a small fraction of paraffin wax (C20–C28) into low-density
          or linear low-density polyethylene and process into standard films.
          The wax is not encapsulated, chemically bound, or coated.
        </p>

        <p>
          When properly confined within the amorphous regions of polyethylene,
          the paraffin undergoes a solid–solid or solid–liquid phase transition
          during heating, absorbing latent heat and reducing the rate of
          temperature increase.
        </p>

        <h2>Minimal test protocol</h2>
        <ul>
          <li>
            Compound LDPE or LLDPE with 5–10 wt% paraffin wax (C20–C28)
          </li>
          <li>
            Extrude into 50–150 μm films using standard film extrusion equipment
          </li>
          <li>
            Apply a controlled heat ramp while measuring surface or internal
            temperature versus time
          </li>
          <li>
            Compare against neat polyethylene films of identical thickness
          </li>
        </ul>

        <h2>Failure conditions</h2>
        <p>
          The assumption fails if <strong>both</strong> of the following are
          observed:
        </p>
        <ul>
          <li>
            No measurable reduction in peak temperature rise rate or time-to-peak
            temperature compared to neat polyethylene
          </li>
          <li>
            Visible wax migration, oiling, or &gt;1% mass loss after 48 hours at
            40&nbsp;°C
          </li>
        </ul>

        <h2>Success criteria</h2>
        <ul>
          <li>
            ≥20% reduction in peak temperature rise rate under identical heating
          </li>
          <li>
            ≥10% increase in time to peak temperature
          </li>
          <li>
            No visible exudation or ≤1% mass loss in contact/migration testing
          </li>
        </ul>

        <h2>What breaks if the assumption is false</h2>
        <p>
          Thermal moderation can no longer be treated as requiring specialized
          materials or discrete PCM systems. Commodity polyethylene becomes a
          rate-controlling thermal material, not merely a passive barrier.
        </p>

        <hr />

        <p>
          <em>Status:</em> Final · Immutable
        </p>
      </article>
    </main>
  );
}
