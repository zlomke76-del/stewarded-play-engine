// app/edge-of-knowledge/beip-v1/page.tsx
// ------------------------------------------------------------
// Edge of Knowledge Entry
// Boundary-Encoded Interfacial Persistence (BEIP v1)
// Status: Pre-registered protocol · Results pending
// ------------------------------------------------------------

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BEIP v1 — Boundary-Encoded Interfacial Persistence",
  description:
    "A minimal, falsifiable experiment testing whether polymer interfaces can encode persistent physical memory under near-melt thermal cycling.",
};

export default function BEIPv1Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* ------------------------------------------------------------
         Header
      ------------------------------------------------------------ */}
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Boundary-Encoded Interfacial Persistence (BEIP v1)
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A minimal, falsifiable test for physical memory at polymer interfaces
        </p>
        <div className="mt-6 rounded-md border px-4 py-3 text-sm">
          <strong>Status:</strong> Pre-registered protocol · Results pending
        </div>
      </header>

      {/* ------------------------------------------------------------
         Why This Exists
      ------------------------------------------------------------ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold">Why This Exists</h2>
        <p className="mt-4">
          Semicrystalline polymers frequently exhibit anomalous behavior near
          surfaces and interfaces. After repeated heating, cooling, or service,
          boundary regions may age, soften, embrittle, or crystallize differently
          than the bulk.
        </p>
        <p className="mt-4">
          These effects are widely reported but rarely resolved. The unresolved
          question is simple:
        </p>
        <blockquote className="mt-4 border-l-4 pl-4 italic">
          Do polymer interfaces merely respond transiently to processing, or can
          they encode persistent physical memory that survives ordinary thermal
          cycling?
        </blockquote>
        <p className="mt-4">
          BEIP v1 is a deliberately minimal, pre-registered experiment designed
          to answer this question decisively.
        </p>
      </section>

      {/* ------------------------------------------------------------
         Claim Under Test
      ------------------------------------------------------------ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold">The Claim Under Test</h2>
        <p className="mt-4">
          This experiment tests whether a common plastic— isotactic polypropylene
          (iPP)— can retain a history-dependent physical state at its boundary
          with a solid surface after repeated near-melt thermal cycling.
        </p>
        <ul className="mt-4 list-disc pl-6">
          <li>Localized to the interface rather than the bulk</li>
          <li>Persistent under repeated near-melt cycling</li>
          <li>Erased only by crossing a true full-melt reset</li>
        </ul>
      </section>

      {/* ------------------------------------------------------------
         What This Is Not
      ------------------------------------------------------------ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold">What This Is Not</h2>
        <ul className="mt-4 list-disc pl-6">
          <li>Not a mechanism proposal</li>
          <li>Not an application roadmap</li>
          <li>Not a chemistry modification</li>
          <li>Not a performance claim</li>
        </ul>
        <p className="mt-4">
          This is a boundary test designed to either survive or fail without
          interpretation.
        </p>
      </section>

      {/* ------------------------------------------------------------
         Experimental Design
      ------------------------------------------------------------ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold">
          Experimental Design (Pre-Registered)
        </h2>

        <h3 className="mt-6 font-semibold">Materials</h3>
        <ul className="mt-2 list-disc pl-6">
          <li>Polymer: batch-matched isotactic polypropylene (iPP)</li>
          <li>Film thickness: 50–200 nm (recorded per sample)</li>
          <li>
            Substrates:
            <ul className="mt-2 list-disc pl-6">
              <li>Silicon (native oxide)</li>
              <li>Silanized silicon (hydrophobic)</li>
            </ul>
          </li>
        </ul>

        <h3 className="mt-6 font-semibold">Thermal Reference</h3>
        <p className="mt-2">
          Melting peak temperature (Tm,peak) is determined by DSC on first
          heating at 10 °C/min under inert atmosphere. All protocol temperatures
          are defined relative to the measured Tm,peak for the batch.
        </p>
      </section>

      {/* ------------------------------------------------------------
         Two-Arm Structure
      ------------------------------------------------------------ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold">Two-Arm Test Structure</h2>

        <h3 className="mt-6 font-semibold">
          Arm A — Near-Melt Cycling (Test Condition)
        </h3>
        <ul className="mt-2 list-disc pl-6">
          <li>Temperature: Tm,peak − 8 °C</li>
          <li>
            Adjustment rule: if adjusted, adjust only downward (to −10 °C);
            never higher than −8 °C
          </li>
          <li>Hold: 2 minutes</li>
          <li>Cycles: 8</li>
          <li>Cool to room temperature after final cycle</li>
        </ul>

        <h3 className="mt-6 font-semibold">
          Arm B — Full-Melt Reset (Erase Control)
        </h3>
        <ul className="mt-2 list-disc pl-6">
          <li>Temperature: Tm,peak + 15 °C</li>
          <li>Hold: 15 minutes</li>
          <li>Cycles: 3</li>
          <li>Cool to room temperature after final cycle</li>
        </ul>
      </section>

      {/* ------------------------------------------------------------
         Readouts
      ------------------------------------------------------------ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold">
          Readouts (Observation-Only)
        </h2>

        <h3 className="mt-6 font-semibold">
          Atomic Force Microscopy (Primary)
        </h3>
        <ul className="mt-2 list-disc pl-6">
          <li>Tapping mode</li>
          <li>Height and phase contrast (modulus optional)</li>
          <li>
            Identical, registered coordinates for baseline, post-Arm A, and
            post-Arm B
          </li>
        </ul>
        <p className="mt-2 text-sm italic">
          AFM data is inadmissible if coordinates cannot be reliably re-found.
        </p>

        <h3 className="mt-6 font-semibold">
          Differential Scanning Calorimetry (Secondary)
        </h3>
        <ul className="mt-2 list-disc pl-6">
          <li>Cooling scans: Tc,peak and ΔHc</li>
          <li>Optional reheating: ΔHm to confirm reset quality in Arm B</li>
        </ul>
      </section>

      {/* ------------------------------------------------------------
         Fastest Kill
      ------------------------------------------------------------ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold">
          Single Fastest-Kill Criterion
        </h2>
        <p className="mt-4">
          The hypothesis of boundary-encoded interfacial persistence is
          conclusively falsified if:
        </p>
        <ol className="mt-4 list-decimal pl-6">
          <li>
            AFM shows no reproducible, interface-localized,
            history-dependent signature after Arm A relative to baseline and
            Arm B across substrates and repeats, and
          </li>
          <li>
            DSC shows no systematic separation between Arm A, Arm B, and baseline
            in Tc,peak or ΔHc beyond normal instrument and run-to-run variation.
          </li>
        </ol>
        <p className="mt-4 font-medium">
          If both conditions are met, the line closes.
        </p>
      </section>

      {/* ------------------------------------------------------------
         Impact
      ------------------------------------------------------------ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold">What This Accomplishes</h2>

        <h3 className="mt-6 font-semibold">If the Effect Survives</h3>
        <ul className="mt-2 list-disc pl-6">
          <li>Demonstrates persistent physical memory localized to interfaces</li>
          <li>
            Challenges the assumption that only chemistry or full melting matter
          </li>
          <li>Establishes boundaries as state-bearing regions</li>
        </ul>

        <h3 className="mt-6 font-semibold">If the Effect Fails</h3>
        <ul className="mt-2 list-disc pl-6">
          <li>Closes a long-standing ambiguity in polymer aging</li>
          <li>
            Confirms near-melt cycling does not preserve boundary memory in iPP
          </li>
          <li>Prevents continued drift into artifact-driven explanations</li>
        </ul>
      </section>

      {/* ------------------------------------------------------------
         Footer
      ------------------------------------------------------------ */}
      <footer className="border-t pt-8 text-sm text-muted-foreground">
        <p>
          No mechanism claims. No applications inferred. No chemistry changes
          proposed.
        </p>
        <p className="mt-2">
          This Edge of Knowledge entry exists to decide whether a boundary can
          remember — or not.
        </p>
      </footer>
    </main>
  );
}
