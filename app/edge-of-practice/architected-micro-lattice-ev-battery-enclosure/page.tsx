// app/edge-of-practice/architected-micro-lattice-ev-battery-enclosure/page.tsx
// ============================================================================
// EDGE OF PRACTICE
// Replacing laminate composites with failure-governed lattice structures
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Replacing Laminate Composites with Failure-Governed Lattice Structures | Edge of Practice",
  description:
    "A falsifiable structural alternative to laminate composites for EV battery enclosures, based on architected micro-lattice sandwich panels with governed failure behavior.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function EdgeOfPractice_AMSS_EV_Battery_Enclosure() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          Replacing Laminate Composites with Failure-Governed Lattice Structures
        </h1>

        <p className="text-lg text-neutral-500">
          Edge of Practice · Architected Micro-Lattice Structural Systems (AMSS)
        </p>

        <hr />

        {/* PURPOSE */}
        <h2>Purpose</h2>
        <p>
          This entry challenges the prevailing assumption that lightweight,
          high-performance structural panels must rely on laminate composite
          architectures with hidden internal failure modes. It proposes a
          falsifiable alternative: architected micro-lattice sandwich panels
          whose failure behavior is explicitly governed, progressive, and
          inspectable.
        </p>

        {/* PRACTICE GAP */}
        <h2>Practice Gap</h2>
        <p>
          Carbon fiber and other laminate composites excel at peak
          stiffness-to-weight performance but suffer from intrinsic limitations:
          brittle failure, subsurface delamination, complex inspection, and poor
          repairability. In safety-critical applications such as EV battery
          enclosures, these hidden failure modes create lifecycle risk that is
          managed procedurally rather than structurally.
        </p>

        <p>
          Current practice treats damage detection as an inspection problem. This
          proposal treats it as a design problem.
        </p>

        {/* PROPOSED ALTERNATIVE */}
        <h2>Proposed Structural Alternative</h2>
        <p>
          The proposed platform replaces laminate composites with{" "}
          <strong>Architected Micro-Lattice Structural Systems (AMSS)</strong> —
          sandwich panels in which load-bearing performance, energy absorption,
          and failure behavior are determined by a manufacturable micro-scale
          lattice core mechanically interlocked to thin metallic skins.
        </p>

        {/* FIRST PRODUCT */}
        <h2>First Product Scope</h2>
        <p>
          <strong>Structural Product:</strong> EV battery enclosure panel
        </p>
        <p>
          This application was selected due to high production volume, strict
          impact and intrusion requirements, intolerance for hidden damage, and
          strong economic pressure against carbon fiber.
        </p>

        {/* ARCHITECTURE */}
        <h2>Structural Architecture</h2>

        <h3>Core</h3>
        <ul>
          <li>Expanded or roll-formed aluminum micro-lattice</li>
          <li>Feature scale: ~200–1000 μm</li>
          <li>
            Stretch-biased topology with intentionally designed crush initiators
          </li>
          <li>Manufactured using continuous, automotive-rate processes</li>
        </ul>

        <h3>Skins</h3>
        <ul>
          <li>Stamped aluminum alloy (AA5xxx / AA6xxx)</li>
          <li>Thickness: 0.8–1.5 mm depending on intrusion requirements</li>
          <li>
            Primary functions: bending stiffness, environmental sealing, impact
            load spreading
          </li>
        </ul>

        <h3>Joining Strategy</h3>
        <ul>
          <li>
            Mechanical interlocks formed between lattice nodes and skin
            embossments
          </li>
          <li>
            Structural adhesive film as a secondary, fatigue-friendly load path
          </li>
          <li>
            No welds through bondlines; no reliance on hidden adhesive integrity
          </li>
        </ul>

        {/* FAILURE GOVERNANCE */}
        <h2>Failure Governance Model</h2>
        <p>
          Unlike laminate composites, failure in AMSS is designed to be{" "}
          <strong>progressive, localized, and legible</strong>.
        </p>

        <ul>
          <li>Impact energy is absorbed via controlled lattice crushing</li>
          <li>Failure localizes into bounded zones rather than propagating</li>
          <li>Skins plastically deform but remain mechanically attached</li>
          <li>
            Post-impact damage is visible and geometrically measurable without
            advanced inspection equipment
          </li>
        </ul>

        <p>
          The structure does not fail silently. It communicates its state through
          topology.
        </p>

        {/* INSPECTION & REPAIR */}
        <h2>Inspection and Repair</h2>
        <p>
          AMSS panels are designed for inspection using visual geometry checks
          and simple depth or deformation gauges. Repair is modular: damaged
          panels are removed and replaced without curing ovens, composite scrap
          handling, or subsurface damage uncertainty.
        </p>

        {/* THERMAL & FIRE */}
        <h2>Thermal and Fire Considerations</h2>
        <p>
          The lattice architecture enables intentional thermal breaks and
          integration of ceramic or intumescent barrier layers at the battery
          interface. Structural integrity is not dependent on adhesive
          performance during or after thermal runaway events.
        </p>

        {/* MANUFACTURING */}
        <h2>Manufacturing Constraints</h2>
        <ul>
          <li>Target cycle time: ≤ 90 seconds per finished panel</li>
          <li>
            Continuous lattice feed, automated skin stamping, press lamination,
            and mechanical locking
          </li>
          <li>
            No sacrificial templates, nanoscale printing, or slow chemical
            processing steps
          </li>
        </ul>

        {/* WHY EDGE */}
        <h2>Why This Is Edge of Practice</h2>
        <p>
          This proposal does not claim universal superiority. It explicitly
          trades peak material stiffness for inspectability, repairability, and
          governed failure. It is falsifiable through standardized impact,
          intrusion, corrosion, and durability testing.
        </p>

        <p>
          If the lattice fails to control damage localization, survive corrosion,
          or meet automotive throughput targets, the approach should be rejected.
        </p>

        {/* NAVIGATION */}
        <hr />
        <p className="text-sm text-neutral-500">
          ←{" "}
          <Link href="/edge-of-practice">
            Back to Edge of Practice Index
          </Link>
        </p>
      </article>
    </main>
  );
}
