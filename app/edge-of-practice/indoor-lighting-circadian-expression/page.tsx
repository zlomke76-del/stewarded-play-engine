import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Indoor Lighting Spectra Effects on Circadian Gene Expression — Edge of Practice",
  description:
    "An in vitro experiment testing whether common indoor lighting spectra cause acute disruption of circadian gene expression in cultured human cells under controlled conditions.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function IndoorLightingCircadianExpression() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          Indoor Lighting Spectra Influences on Circadian Gene Expression in Human
          Cells
        </h1>

        <h2>Problem Statement</h2>
        <p>
          This experiment tests whether exposure to different indoor lighting
          spectra, under consistent laboratory conditions, causes acute changes
          in circadian gene expression in cultured human cells. Only direct gene
          expression changes are measured. No behavioral, sleep, cognitive, or
          clinical conclusions are drawn.
        </p>

        <h2>Hidden Assumption Being Tested</h2>
        <p>
          Common indoor lighting spectra do not significantly alter circadian
          gene expression when exposure occurs over short durations under
          otherwise stable laboratory conditions.
        </p>

        <h2>Lighting Spectra Tested</h2>
        <ul>
          <li>Blue-enriched LED (peak ~460 nm, FWHM ~20 nm)</li>
          <li>Warm white LED (CCT ~3000 K)</li>
          <li>Cool white LED (CCT ~6500 K)</li>
          <li>Dark control (no incident light; plates wrapped in opaque foil)</li>
        </ul>

        <h2>Exposure Conditions</h2>
        <ul>
          <li>Exposure duration: 4 hours continuous illumination</li>
          <li>Incubation conditions: 37 °C, 5% CO₂</li>
          <li>
            Light intensity: ~100 lux at the cell monolayer for all illuminated
            conditions
          </li>
          <li>
            Exposure begins immediately after circadian synchronization
          </li>
        </ul>

        <h2>Cell System and Synchronization</h2>
        <ul>
          <li>
            Cell line: Human fibroblasts (e.g., Hs68) or equivalent
          </li>
          <li>Confluence at exposure: 70–80%</li>
          <li>
            Synchronization protocol:
            <ul>
              <li>2-hour serum shock using 50% serum</li>
              <li>
                Replace with standard growth media for 24 hours before exposure
              </li>
            </ul>
          </li>
        </ul>

        <h2>Gene Expression Measurement</h2>
        <ul>
          <li>Total RNA extracted immediately after 4-hour exposure</li>
          <li>cDNA synthesized using standard reverse transcription</li>
          <li>Quantitative PCR performed for:</li>
          <ul>
            <li>PER2 (core circadian gene)</li>
            <li>BMAL1 (core circadian gene)</li>
            <li>GAPDH (housekeeping normalization control)</li>
          </ul>
          <li>
            Data analysis performed using ΔΔCt method relative to dark control
          </li>
        </ul>

        <h2>Binary Disruption Threshold</h2>
        <p>
          For each lighting condition (blue, warm white, cool white):
        </p>
        <ul>
          <li>
            <strong>Disruption:</strong> Expression of PER2 or BMAL1 changes by
            ≥1.5-fold (up or down; |log₂ fold-change| ≥0.58) relative to dark
            control
          </li>
          <li>
            <strong>No disruption:</strong> Both genes change by &lt;1.5-fold
            relative to dark control
          </li>
        </ul>

        <h2>Controls and Technical Requirements</h2>
        <ul>
          <li>Minimum three biological replicates per condition</li>
          <li>
            All non-light variables held constant (media batch, plasticware,
            temperature, CO₂)
          </li>
          <li>
            Light sources calibrated before each experiment for spectral output
            and intensity
          </li>
          <li>
            No unintended light exposure before, during, or after synchronization
          </li>
        </ul>

        <h2>Boundaries</h2>
        <ul>
          <li>
            Only in vitro gene expression is measured
          </li>
          <li>
            No claims about sleep, behavior, cognition, or health
          </li>
          <li>
            No extrapolation to humans, animals, or long-term exposure
          </li>
          <li>No live animal or human testing</li>
        </ul>

        <h2>Why This Matters</h2>
        <p>
          This experiment directly tests whether widely used indoor lighting
          spectra interact with circadian molecular machinery at the cellular
          level. Any detected disruption challenges the assumption that indoor
          lighting is biologically neutral over short exposure windows, without
          invoking downstream or clinical interpretations.
        </p>
      </article>
    </main>
  );
}
