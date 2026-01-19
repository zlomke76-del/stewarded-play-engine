import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boundary-Layer Vorticity Harvesting for Turbine-Free Wind Energy | Moral Clarity AI",
  description:
    "A constructive physics experiment exploring direct energy harvesting from near-surface turbulent and rotational air flows without turbines.",
  openGraph: {
    title: "Boundary-Layer Vorticity Harvesting for Turbine-Free Wind Energy",
    description:
      "Harvesting kinetic energy from micro-vortices and shear layers using compliant oscillators.",
    url: "https://moralclarity.ai/edge-of-practice/constructive-physics/boundary-layer-vorticity-harvesting",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function BoundaryLayerVorticityHarvestingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Boundary-Layer Vorticity Harvesting for Turbine-Free Wind Energy</h1>

        <p className="lead">
          <strong>
            Kinetic energy embedded in near-surface turbulent airflows can be
            harvested directly from rotational motion, without turbines or bulk
            flow interception.
          </strong>
        </p>

        <h2>One-Sentence Discovery</h2>
        <p>
          Recoverable wind energy exists within persistent micro-vortices and
          shear layers near surfaces and obstacles, and can be transduced by
          compliant oscillators without relying on large-scale wind rotors.
        </p>

        <h2>The Physical Mechanism</h2>
        <p>
          Rough surfaces, building edges, and terrain features generate stable
          vorticity structures within the atmospheric boundary layer. These
          rotational flows carry kinetic energy that does not contribute to
          mean wind velocity but persists as localized turbulence. Flexible
          fins, membranes, or beams placed in these regions experience driven
          oscillations through vortex interaction, converting rotational
          kinetic energy into mechanical motion.
        </p>

        <h2>New Scientific Object</h2>
        <p>
          <strong>Vorticity Energy Density Gradient (VEDG)</strong>: a measurable
          spatial gradient describing recoverable rotational kinetic energy per
          unit volume within turbulent boundary layers, independent of mean
          wind speed.
        </p>

        <h2>Edge-of-Practice Experiment</h2>
        <p>
          Place compliant oscillatory elements adjacent to roughness features
          in a wind tunnel or outdoor boundary-layer flow. Compare harvested
          mechanical or electrical energy under laminar and turbulent
          conditions at equal mean wind velocity.
        </p>
        <p>
          <strong>Binary outcome:</strong> If oscillatory elements produce
          sustained net energy output in turbulent regimes absent in laminar
          flow, vorticity harvesting is validated.
        </p>

        <h2>Why This Matters</h2>
        <p>
          This approach opens wind energy harvesting in environments unsuitable
          for turbines—urban corridors, rooftops, and complex terrain—by
          accessing a previously ignored kinetic energy reservoir.
        </p>
      </article>
    </main>
  );
}
