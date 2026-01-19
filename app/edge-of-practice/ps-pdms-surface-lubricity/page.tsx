import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — PS/PDMS Surface Lubricity | Moral Clarity AI",
  description:
    "Tests whether trace PDMS in polystyrene creates a stable, optically clear, low-friction surface via pure interfacial physics.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PSPDMSEdgePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Surface Lubricity and Optical Stability in PS via Trace PDMS</h1>

        <h2>Assumption under test</h2>
        <p>
          Low-level internal lubricants cannot produce durable, low-friction
          polystyrene surfaces without blooming, haze, or surface oiling.
        </p>

        <h2>Why this assumption matters</h2>
        <p>
          Polystyrene is widely used in consumer-facing products where friction,
          dust adhesion, fingerprinting, and surface wear are persistent issues.
          The dominant mitigation strategy relies on coatings or surface
          treatments, increasing cost and failure risk.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Compound general-purpose polystyrene with 0.5–2 wt% low–molecular weight
          polydimethylsiloxane (PDMS). Injection mold flat plaques under standard
          processing conditions without surface treatment or post-processing.
        </p>

        <p>
          During molding, PDMS migrates toward the polymer–air interface,
          forming a nanometer-scale lubricious layer driven purely by surface
          energy minimization. No chemical bonding or phase reaction occurs.
        </p>

        <h2>Primary measurements</h2>
        <ul>
          <li>
            Tribological testing (pin-on-disk or sliding friction) versus neat PS
          </li>
          <li>
            Optical haze and gloss before and after standardized abrasion
          </li>
          <li>
            Visual inspection for blooming or oiling after mild heating (40 °C)
          </li>
        </ul>

        <h2>Failure condition</h2>
        <p>
          Any visible surface blooming, oiling, haze increase, or loss of optical
          clarity after 24 hours at 40 °C or after solvent wipe constitutes
          failure.
        </p>

        <h2>Pass condition</h2>
        <p>
          A reduction in friction coefficient of ≥30% compared to neat PS, with
          no visible surface oiling and no measurable haze increase.
        </p>

        <h2>What breaks if this assumption is false</h2>
        <p>
          If the assumption fails, commodity PS can achieve durable, low-friction,
          dust-resistant surfaces without coatings, chemistry, or additional
          process steps—reframing internal additives as surface physics tools
          rather than bulk modifiers.
        </p>

        <hr />
        <p>
          <em>Status:</em> Final · Immutable
        </p>
      </article>
    </main>
  );
}
