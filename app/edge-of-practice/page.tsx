import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edge of Practice — Short-Cycle Experiments | Moral Clarity AI",
  description:
    "A complete public index of short-cycle, falsifiable experiments designed to test hidden assumptions governing health, materials, energy, automation, and everyday human environments.",
  openGraph: {
    title: "Edge of Practice — Short-Cycle Experiments",
    description:
      "An exhaustive index of short-cycle experiments surfacing hidden assumptions with direct human relevance.",
    url: "https://moralclarity.ai/edge-of-practice",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EdgeOfPracticeIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Edge of Practice</h1>

        <p className="lead">
          <strong>
            Short-cycle experiments that break false assumptions at human scale
          </strong>
        </p>

        <p>
          <em>Edge of Practice</em> is a public index of small, decisive
          experiments executable using standard laboratory tools, commodity
          materials, and short timelines. These experiments are not designed to
          optimize systems or invent products.
        </p>

        <hr />

        <h2>Experiment Lifecycle</h2>
        <ul>
          <li>
            <strong>Short-Cycle</strong> — rapid falsification (this index)
          </li>
          <li>
            <Link href="/edge-of-practice/extended-cycle">Extended Cycle</Link>
          </li>
          <li>
            <Link href="/edge-of-practice/persistence">Persistence</Link>
          </li>
        </ul>

        <hr />

        <h2>Complete Short-Cycle Experiment Index</h2>

        {/* ================= AUTOMATION ================= */}

        <h3>Automation, Cognition, and Control</h3>
        <ul>
          <li>
            <Link href="/edge-of-practice/agentic-normalization-drift">
              Agentic Normalization Drift
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/alarm-parsing-collapse-threshold">
              Alarm Parsing Collapse Threshold
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/autonomous-handoff-blackout">
              Autonomous Handoff Blackout
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/irreversible-cognitive-dead-zones">
              Irreversible Cognitive Dead Zones
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/irreversible-normalization-drift">
              Irreversible Normalization Drift
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/human-supervision-autonomy">
              Human Supervision as Failsafe
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/post-deployment-monitoring-ai">
              Post-Deployment Monitoring in AI
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/polyphonic-ai-bounded-authority">
              Polyphonic AI Under Bounded Authority
            </Link>
          </li>
        </ul>

        {/* ================= MATERIALS ================= */}

        <h3>Materials, Polymers, and Surface Effects</h3>
        <ul>
          <li>
            <Link href="/edge-of-practice/antibiotic-resistance-gene-cleaning">
              Antibiotic Resistance Gene Cleaning
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/compostable-packaging-microfragments">
              Compostable Packaging Microfragments
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/glove-additive-leaching-alcohol-sanitizer">
              Glove Additive Leaching
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/hdpe-die-entrance-viscosity-melt-fracture">
              HDPE Die-Entrance Melt Fracture
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/hdpe-ldpe-interfacial-toughening">
              HDPE–LDPE Interfacial Toughening
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/pc-abs-interfacial-microdamping">
              PC–ABS Interfacial Microdamping
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/pc-pmma-scratch-resistance">
              PC–PMMA Scratch Resistance
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/pe-paraffin-thermal-buffering">
              PE–Paraffin Thermal Buffering
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/ps-pdms-surface-lubricity">
              PS–PDMS Surface Lubricity
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/pet-pvdf-electret-humidity-edge-case">
              PET–PVDF Electret Humidity Edge Case
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/gauge-correlated-asymmetry-in-polymer-cooling">
              Gauge-Correlated Cooling Asymmetry
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/architected-micro-lattice-ev-battery-enclosure">
              Architected Micro-Lattice EV Battery Enclosure
            </Link>
          </li>

          {/* === ADDITIVE ENTRY — NO DELETIONS === */}
          <li>
            <Link href="/edge-of-practice/pom-path-memory-bimodal-basin">
              POM Path-Memory Bimodal Basin Test
            </Link>
          </li>

          {/* === ADDITIVE ENTRY — NO DELETIONS === */}
          <li>
            <Link href="/edge-of-practice/tpu-segmental-network-decoupling">
              TPU Segmental Network Decoupling Test
            </Link>
          </li>
        </ul>

        {/* ================= ENERGY ================= */}

        <h3>Energy, Physics, and Passive Systems</h3>
        <ul>
          <li>
            <Link href="/edge-of-practice/constructive-physics">
              Constructive Physics
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/phase-locked-capillary-oscillation">
              Phase-Locked Capillary Oscillation
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/radiative-tension-rectification">
              Radiative Tension Rectification
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/spectral-boundary-layer-destabilization">
              Spectral Boundary-Layer Destabilization
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/thermomechanical-phase-aligned-insulation">
              Thermomechanical Phase-Aligned Insulation
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/embedded-osmotic-power">
              Embedded Osmotic Power
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/phase-locked-capillary-oscillation">
              Phase-Locked Capillary Oscillation
            </Link>
          </li>
        </ul>

        {/* ================= ENVIRONMENT ================= */}

        <h3>Environment, Exposure, and Human Health</h3>
        <ul>
          <li>
            <Link href="/edge-of-practice/air-ionizer-electrostatic-charge">
              Air Ionizer Electrostatic Charge
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/heavy-metal-remobilization-urban-soils">
              Heavy Metal Remobilization
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/hot-water-ph-metal-leaching">
              Hot Water pH-Driven Metal Leaching
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/indoor-lighting-circadian-expression">
              Indoor Lighting Circadian Expression
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/microplastics">
              Indoor Microplastics
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/uv-sterilization-shadows">
              UV Sterilization Shadows
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/viral-viability-indoor-surfaces">
              Viral Viability on Indoor Surfaces
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/vitamin-loss-refrigerated-juice">
              Vitamin Loss in Refrigerated Juice
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/sweat-driven-device-corrosion">
              Sweat-Driven Device Corrosion
            </Link>
          </li>
        </ul>

        <hr />

        <p className="text-sm text-muted-foreground">
          This page is the authoritative index of all short-cycle experiments.
          Experiments are fixed at publication and revised only by explicit
          versioning to preserve epistemic continuity.
        </p>
      </article>
    </main>
  );
}
