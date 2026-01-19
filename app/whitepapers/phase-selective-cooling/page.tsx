// app/whitepapers/phase-selective-cooling/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Phase-Selective Cooling Fabric: A Physics-Grounded Assessment | Moral Clarity AI",
  description:
    "A physics-honest evaluation of passive cooling textiles using radiative heat loss and phase-change materials. Benefits, limits, and falsifying experiments.",
  openGraph: {
    title: "Phase-Selective Cooling Fabric: A Physics-Grounded Assessment",
    description:
      "An honest assessment of when passive cooling fabrics work, when they fail, and how to test them.",
    url: "https://moralclarity.ai/whitepapers/phase-selective-cooling",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PhaseSelectiveCoolingWhitepaper() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Phase-Selective Cooling Fabric</h1>
        <p className="lead">
          <strong>A Physics-Grounded Assessment</strong>
        </p>

        <p className="text-sm text-muted-foreground">
          White Paper · Public Reference · Moral Clarity AI
        </p>

        <h2>Abstract</h2>
        <p>
          Passive cooling textiles—often described as “radiative cooling” or
          “phase-change” fabrics—are increasingly promoted as low-energy solutions
          to heat stress. This paper evaluates whether such fabrics are physically
          sound, practically viable, and meaningfully beneficial under real-world
          conditions. The goal is not promotion, but clarity: identifying where the
          physics supports limited benefit, where claims collapse, and how to
          falsify overstatements early.
        </p>

        <h2>Physical Validity</h2>
        <p>
          Passive radiative cooling via emission in the mid-infrared atmospheric
          window (approximately 8–13 μm) is physically valid in principle. A fabric
          with high emissivity in this band can transfer some body heat to a cooler
          sky under appropriate conditions. Phase-change materials (PCMs) placed
          near the skin can temporarily absorb heat during melting, delaying
          temperature rise.
        </p>
        <p>
          However, radiation is only one component of human heat transfer.
          Convection, conduction, and evaporative cooling often dominate—especially
          in warm, humid, or enclosed environments. Radiative cooling only reduces
          net heat load when solar gain is minimized, humidity is low, and sky view
          is unobstructed. PCMs provide finite, one-time buffering and must be
          re-solidified to function again.
        </p>

        <h2>Boundary Conditions and Regime Limits</h2>

        <h3>Where Limited Benefit Is Plausible</h3>
        <ul>
          <li>Outdoor environments with clear sky exposure</li>
          <li>Dry or low-humidity climates</li>
          <li>Shaded conditions or nighttime use</li>
          <li>Minimal surrounding thermal back-radiation</li>
        </ul>

        <h3>Where the Approach Fails</h3>
        <ul>
          <li>Indoor settings with blocked sky view</li>
          <li>High-humidity environments</li>
          <li>Dense urban “canyon” geometry</li>
          <li>Direct solar exposure without near-perfect reflectivity</li>
          <li>Strong hot airflow where convection dominates</li>
        </ul>

        <h2>Failure Modes and Overclaims</h2>
        <p>
          Common misconceptions include claims of universal cooling, sustained
          temperature reduction, or replacement of conventional heat-mitigation
          strategies. Passive fabrics cannot reliably cool below ambient
          temperature, cannot sustain PCM effects indefinitely, and cannot replace
          hydration, airflow, shade, or active cooling in high-risk conditions.
        </p>
        <p>
          The greatest risk is not inefficiency but false confidence. Overclaiming
          may cause users to delay or abandon proven protective measures.
        </p>

        <h2>Minimal Falsifying Experiments</h2>

        <h3>1. Controlled Skin Temperature Test</h3>
        <p>
          Compare skin and core temperature of participants (or a thermal manikin)
          wearing the fabric versus standard breathable clothing under matched
          environmental conditions. Include a shade-only control.
        </p>
        <p>
          <strong>Falsification criterion:</strong> No statistically significant
          improvement beyond conventional clothing or placebo.
        </p>

        <h3>2. Radiative Flux Measurement</h3>
        <p>
          Measure net radiative heat loss from a heated plate covered with the
          fabric under open sky versus indoor conditions.
        </p>
        <p>
          <strong>Falsification criterion:</strong> Net additional cooling power
          below ~10 W/m² or loss of effect indoors.
        </p>

        <h2>Humanitarian Impact Assessment</h2>
        <p>
          Any plausible cooling effect is modest and highly context-dependent.
          While potentially useful as a supplementary comfort aid in narrow
          conditions, this approach does not meaningfully reduce the need for air
          conditioning or other primary heat-mitigation strategies for vulnerable
          populations.
        </p>

        <h2>Judgment</h2>
        <p>
          <strong>Proceed cautiously.</strong> The physics permits limited benefit
          in specific regimes, but the approach is not transformative and must not
          be presented as a standalone solution. Early falsification testing and
          explicit communication of limits are essential.
        </p>

        <hr />

        <p>
          <strong>Note:</strong> This assessment was generated through structured
          reasoning by <em>Solace</em>, Moral Clarity AI’s evaluation system. It is
          published as a public reference and may be freely shared.
        </p>

        <p className="text-sm text-muted-foreground">
          Version 1.0 · White Paper · Updated only by revision
        </p>
      </article>
    </main>
  );
}
