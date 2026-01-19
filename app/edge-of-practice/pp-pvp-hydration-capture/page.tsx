import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PP + PVP Hydration-Mediated Aerosol Capture | Edge of Practice",
  description:
    "A falsifiable Edge of Practice experiment testing whether low-level PVP in polypropylene fibers improves aerosol capture via hydration-mediated surface interactions.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PP_PVP_Experiment() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">

        <h1>Polypropylene Fibers with Interface-Localized Polyvinylpyrrolidone</h1>

        <p>
          <strong>Edge of Practice Experiment</strong>
        </p>

        <hr />

        {/* -------------------------------------------------- */}
        {/* PURPOSE */}
        {/* -------------------------------------------------- */}
        <section>
          <h2>Purpose</h2>
          <p>
            To test whether adding a small amount of polyvinylpyrrolidone (PVP)
            to polypropylene (PP) melt-blown fibers measurably increases aerosol
            capture efficiency in humid air via hydration-mediated surface
            interactions, without relying on electrostatic charging or chemical
            reactivity.
          </p>
        </section>

        {/* -------------------------------------------------- */}
        {/* WHY THIS MATTERS */}
        {/* -------------------------------------------------- */}
        <section>
          <h2>Why This Experiment Exists</h2>
          <p>
            Polypropylene melt-blown fibers dominate global air filtration.
            Their primary failure mode occurs in humid environments, where
            electrostatic capture efficiency decays.
          </p>

          <p>
            Polyvinylpyrrolidone is widely used as a water-soluble binder or
            excipient and is generally dismissed as incompatible with durable,
            hydrophobic polymers. This assumption has prevented investigation
            of whether trace PVP can localize at PP fiber interfaces and form
            stable hydration shells that enhance particle adhesion.
          </p>

          <p>
            This experiment tests that assumption directly.
          </p>
        </section>

        {/* -------------------------------------------------- */}
        {/* HYPOTHESIS */}
        {/* -------------------------------------------------- */}
        <section>
          <h2>Hypothesis</h2>
          <p>
            At low loading (≈2–5 wt%), PVP preferentially enriches at the PP
            fiber surface during melt-blowing. In humid air, PVP’s polar lactam
            groups stabilize a persistent hydration layer at the air–polymer
            interface.
          </p>

          <p>
            This hydration shell increases local surface polarity and dielectric
            contrast, enhancing aerosol and droplet capture through dipolar and
            hydrogen-bond-mediated interactions.
          </p>

          <p>
            The effect should:
          </p>

          <ul>
            <li>Increase with relative humidity</li>
            <li>Disappear if PVP leaches</li>
            <li>Require no electrostatic charging</li>
          </ul>
        </section>

        {/* -------------------------------------------------- */}
        {/* EXPERIMENTAL DESIGN */}
        {/* -------------------------------------------------- */}
        <section>
          <h2>Experimental Design (MVP)</h2>

          <h3>Materials</h3>
          <ul>
            <li>Filtration-grade polypropylene pellets</li>
            <li>Polyvinylpyrrolidone (Mw ≈ 40k)</li>
          </ul>

          <h3>Processing</h3>
          <ul>
            <li>Melt-blend PP with 5 wt% PVP</li>
            <li>Produce nonwoven mats via standard melt-blown processing</li>
            <li>No surface coatings or post-treatments</li>
          </ul>

          <h3>Controls</h3>
          <ul>
            <li>Neat PP melt-blown fiber mat</li>
          </ul>
        </section>

        {/* -------------------------------------------------- */}
        {/* PASS / FAIL CRITERIA */}
        {/* -------------------------------------------------- */}
        <section>
          <h2>Pass / Fail Criteria</h2>

          <h3>Non-Leaching Gate (Absolute)</h3>
          <p>
            72-hour water extraction at room temperature.
            PVP loss must be &lt;1% by mass (gravimetric or UV-Vis / FTIR).
          </p>

          <p>
            <strong>Any measurable migration above threshold terminates the experiment.</strong>
          </p>

          <h3>Functional Test</h3>
          <ul>
            <li>NaCl aerosol (0.3 µm)</li>
            <li>Fixed pressure drop (≈100 Pa)</li>
            <li>Test at 30%, 60%, and 80% RH</li>
          </ul>

          <p>
            <strong>Success threshold:</strong> ≥15% higher capture efficiency
            at 60% RH compared to neat PP.
          </p>
        </section>

        {/* -------------------------------------------------- */}
        {/* FAILURE MODES */}
        {/* -------------------------------------------------- */}
        <section>
          <h2>Primary Failure Modes</h2>
          <ul>
            <li>PVP leaching under humidity exposure</li>
            <li>No statistically meaningful improvement in capture</li>
            <li>Mechanical or airflow degradation due to blending</li>
          </ul>
        </section>

        {/* -------------------------------------------------- */}
        {/* INTERPRETATION */}
        {/* -------------------------------------------------- */}
        <section>
          <h2>Interpretation Rules</h2>
          <ul>
            <li>No extrapolation beyond tested humidity range</li>
            <li>No claims of antimicrobial or biocidal action</li>
            <li>No performance claims without extraction validation</li>
          </ul>

          <p>
            A positive result demonstrates that hydration-mediated surface
            physics — not electrostatics — can materially improve real-world
            filtration performance using commodity polymers.
          </p>
        </section>

        {/* -------------------------------------------------- */}
        {/* GOVERNANCE */}
        {/* -------------------------------------------------- */}
        <section>
          <h2>Governance</h2>
          <p>
            This experiment does not claim product readiness, regulatory
            clearance, or downstream application suitability.
          </p>

          <p>
            Its sole purpose is to falsify or validate a single physical
            assumption under realistic operating conditions.
          </p>
        </section>

      </article>
    </main>
  );
}
