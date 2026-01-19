import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Antibiotic Resistance Gene Shifts After Non-Antimicrobial Household Cleaning — Edge of Practice",
  description:
    "A controlled surface-sampling experiment testing whether routine non-antimicrobial cleaning alters antibiotic resistance gene abundance or transfer markers on household surfaces.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AntibioticResistanceGeneCleaning() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          Antibiotic Resistance Gene Spread After Non-Antimicrobial Household
          Cleaning
        </h1>

        <h2>Problem Statement</h2>
        <p>
          This experiment tests whether cleaning common household surfaces with
          non-antimicrobial products alters the abundance of antibiotic
          resistance genes (ARGs) or markers associated with horizontal gene
          transfer in surface-associated bacterial communities. The experiment
          measures gene prevalence only and does not assess pathogens, infection
          risk, or health outcomes.
        </p>

        <h2>Hidden Assumption Being Tested</h2>
        <p>
          Routine household cleaning using non-antimicrobial products does not
          meaningfully change the distribution or abundance of antibiotic
          resistance genes on surfaces.
        </p>

        <h2>Sampling Plan</h2>
        <ul>
          <li>
            Select three frequently touched household surfaces (e.g., kitchen
            countertop, bathroom sink, refrigerator handle).
          </li>
          <li>
            For each surface, collect two samples:
            <ul>
              <li>
                <strong>T0 (Baseline):</strong> immediately before cleaning
              </li>
              <li>
                <strong>T1 (Post-cleaning):</strong> 24 hours after cleaning
              </li>
            </ul>
          </li>
          <li>
            Clean surfaces once using a standard non-antimicrobial household
            detergent, following manufacturer instructions.
          </li>
          <li>
            Swab a consistent 10 cm × 10 cm area using sterile pre-moistened
            swabs.
          </li>
          <li>
            Preserve swabs on ice during transport and store at −20 °C until DNA
            extraction.
          </li>
        </ul>

        <h2>qPCR Targets</h2>
        <ul>
          <li>
            <strong>Antibiotic resistance genes:</strong> tetA, blaCTX-M, sul1
          </li>
          <li>
            <strong>Horizontal transfer marker:</strong> intI1 (class 1 integron
            integrase)
          </li>
          <li>
            <strong>Normalization gene:</strong> 16S rRNA
          </li>
          <li>
            Published, validated primer sets must be used for all targets.
          </li>
          <li>
            All reactions performed in triplicate with absolute quantification
            using standard curves.
          </li>
        </ul>

        <h2>Data Processing</h2>
        <ul>
          <li>
            Extract total DNA using a kit suitable for environmental surface
            samples.
          </li>
          <li>
            Calculate normalized abundance for each gene:
            <br />
            (gene copies) / (16S rRNA gene copies)
          </li>
          <li>
            For each gene and surface, compute change:
            <br />
            Δ = log<sub>10</sub>(T1 / T0)
          </li>
        </ul>

        <h2>Binary Signal Change Threshold</h2>
        <ul>
          <li>
            <strong>Negative Result:</strong> All genes on all surfaces change by
            less than ±0.5 log<sub>10</sub> (no significant shift).
          </li>
          <li>
            <strong>Positive Result:</strong> Any gene on any surface changes by
            ±0.5 log<sub>10</sub> or more (≈ threefold change).
          </li>
        </ul>

        <h2>Explicit Non-Claims</h2>
        <ul>
          <li>No identification of pathogens or infectious organisms</li>
          <li>No assessment of clinical infection risk or health outcomes</li>
          <li>No measurement of microbial load or surface sterility</li>
          <li>
            No determination of gene transfer mechanisms or causality
          </li>
          <li>
            Results apply only to gene abundance and transfer-associated markers
          </li>
        </ul>

        <h2>Why This Matters</h2>
        <p>
          This experiment directly tests whether everyday cleaning practices can
          shift the genetic composition of surface-associated microbial
          communities in ways not captured by conventional cleanliness metrics.
          Any detected change challenges assumptions about the neutrality of
          routine cleaning with respect to resistance gene ecology.
        </p>

        <hr />

        <h2>Below the Edge: Connectivity-Controlled Persistence</h2>

        <h3>Frozen Assumption</h3>
        <p>
          All regions of the system contribute to genetic persistence in
          proportion to their average properties, with no spatially connected
          subset able to disproportionately reweight antibiotic resistance gene
          abundance regardless of size or response rate.
        </p>

        <h3>Structural Decomposition</h3>
        <p>
          Persistence of antibiotic resistance genes on cleaned surfaces is
          governed by a heterogeneous distribution of local survival,
          recolonization, and horizontal gene transfer timescales. These
          timescales are spatially and functionally correlated through shared
          microenvironments, contact patterns, and surface topology. Local
          fast-response regions—ARG-bearing organisms or mobile genetic
          elements—may survive disturbance and dominate recolonization despite
          low overall abundance. System behavior is dictated not by mean biomass
          reduction, but by the weight and connectivity of the fastest
          persisting genetic tail.
        </p>

        <h3>Regime Boundary</h3>
        <p>
          The assumption holds only if fast-response ARG-bearing regions remain
          below the percolation threshold for system-spanning influence:
        </p>
        <p>
          (fraction of fast-response ARG reservoirs) × (spatial or functional
          correlation length) &lt; (percolation threshold)
        </p>
        <p>
          Crossing this boundary enables a connected network of resistance gene
          persistence to dominate post-cleaning genetic composition, independent
          of total microbial reduction.
        </p>

        <h3>Failure Signature</h3>
        <p>
          A categorical shift in normalized ARG or integron marker abundance
          following a single non-antimicrobial cleaning event—observable as a
          ≥0.5 log<sub>10</sub> change on any surface—indicating dominance of a
          connected fast-response genetic subset rather than proportional
          disturbance.
        </p>

        <h3>Disentitlements</h3>
        <ul>
          <li>
            ARG persistence can no longer be assumed to scale with total
            microbial load.
          </li>
          <li>
            Non-antimicrobial cleaning cannot be treated as ecologically neutral
            with respect to resistance gene distribution.
          </li>
          <li>
            Mean cleanliness metrics are invalid predictors of resistance gene
            dynamics.
          </li>
          <li>
            Resistance enrichment can no longer be attributed solely to
            antimicrobial exposure.
          </li>
        </ul>

        <h3>Corrected Interpretation</h3>
        <p>
          System-scale persistence of antibiotic resistance genes following
          routine cleaning is controlled by the presence or absence of a
          percolating network of fast-response genetic reservoirs. When such
          regions survive and reconnect, these rare but connected domains—not
          average microbial reduction—govern post-disturbance genetic outcomes.
        </p>
      </article>
    </main>
  );
}
