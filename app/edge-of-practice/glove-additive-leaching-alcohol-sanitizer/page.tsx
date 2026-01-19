import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Standard Lab Glove Additive Leaching After Alcohol Sanitizer Exposure — Edge of Practice",
  description:
    "A controlled experiment testing whether standard laboratory gloves leach additive chemicals after exposure to alcohol-based hand sanitizer.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function GloveAdditiveLeachingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Standard Lab Glove Additive Leaching After Alcohol Sanitizer Exposure</h1>

        <h2>Problem Statement</h2>
        <p>
          This experiment determines whether standard laboratory gloves release
          measurable additive chemicals after exposure to alcohol-based hand
          sanitizer. The focus is on operational and experimental integrity
          risks, not medical, toxicological, or regulatory outcomes.
        </p>

        <h2>Hidden Assumption Being Tested</h2>
        <p>
          Alcohol-based hand sanitizers do not mobilize or extract chemical
          additives from commonly used laboratory gloves.
        </p>

        <h2>What Might Be True Instead</h2>
        <p>
          Alcohol sanitizer exposure may extract glove additives at measurable
          concentrations, introducing unintended chemical contamination into
          laboratory workflows.
        </p>

        <h2>Glove Types Tested</h2>
        <ul>
          <li>Nitrile examination gloves (powder-free, standard thickness)</li>
          <li>Latex examination gloves (powder-free, standard thickness)</li>
          <li>Vinyl examination gloves (standard formulation)</li>
        </ul>
        <p>
          Use new, unused gloves only. Minimum of three replicates per glove
          type.
        </p>

        <h2>Sanitizer Exposure Protocol</h2>
        <ul>
          <li>Sanitizer: 70% ethanol (v/v)</li>
          <li>Cut glove material into uniform 5 cm × 5 cm squares</li>
          <li>Avoid cross-contamination between glove types</li>
          <li>Submerge each square in 50 mL sanitizer for 2 minutes at 20–22°C</li>
          <li>
            Remove using clean forceps; allow to drip dry vertically for 30
            seconds
          </li>
          <li>Do not rinse; proceed immediately to extraction</li>
        </ul>

        <h2>Extraction and GC-MS Analysis</h2>
        <ol>
          <li>
            Place each exposed glove square into a clean glass beaker containing
            50 mL HPLC-grade methanol.
          </li>
          <li>
            Extract for 60 minutes at room temperature without agitation.
          </li>
          <li>
            Transfer methanol extract to GC-MS vials with PTFE-lined caps.
          </li>
          <li>
            Analyze using GC-MS methods validated for glove additives, including
            plasticizers, stabilizers, and antioxidants.
          </li>
          <li>
            Prepare calibration curves for each target compound.
          </li>
          <li>
            Method limit of quantification (LOQ) must be ≤1 µg/mL.
          </li>
          <li>
            Run all extracts in triplicate to confirm reproducibility.
          </li>
        </ol>

        <h2>Binary Leaching Threshold</h2>
        <ul>
          <li>
            <strong>FAIL:</strong> Any detected target additive at a
            concentration ≥10 µg/mL (10,000 µg/L) in any extract.
          </li>
          <li>
            <strong>PASS:</strong> All detected additives remain below 10 µg/mL
            in every extract.
          </li>
        </ul>

        <h2>Operational Relevance</h2>
        <p>
          A failure indicates that sanitizer exposure mobilizes glove additives,
          increasing the risk of chemical contamination in laboratory assays.
          This compromises sample purity, procedural reproducibility, and
          experimental reliability. No medical or toxicity claims are made.
        </p>

        <h2>Documentation Requirements</h2>
        <ul>
          <li>Glove type, manufacturer, lot number</li>
          <li>Sample dimensions and mass</li>
          <li>Exposure and extraction times</li>
          <li>GC-MS method parameters and calibration data</li>
          <li>Detected compound identities and concentrations</li>
          <li>Pass/fail classification per glove type</li>
        </ul>

        <h2>Scope Boundaries</h2>
        <p>
          This experiment does not assess health risk, toxicity, regulatory
          compliance, or suitability for clinical use. Results apply only to
          additive mobilization under the specified sanitizer exposure
          conditions.
        </p>

        <hr />

        <p className="text-sm text-muted-foreground">
          Edge-of-Practice experiments are designed for rapid execution, binary
          falsification, and direct laboratory reproducibility. No extrapolation
          beyond stated thresholds is permitted.
        </p>
      </article>
    </main>
  );
}
