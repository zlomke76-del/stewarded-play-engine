import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Persistence of Pathogenic Bacteria in UV-Sterilized Equipment Shadows — Edge of Practice",
  description:
    "A geometry-controlled experiment testing whether viable bacteria persist in shadowed regions during UV-C sterilization.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function UvSterilizationShadowsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>
          Persistence of Pathogenic Bacteria in UV-Sterilized Equipment Shadows
        </h1>

        <h2>Problem Statement</h2>
        <p>
          This experiment tests whether viable bacteria persist on surfaces that
          are geometrically shadowed during UV-C sterilization. Only survival on
          defined surface regions is measured. No clinical, institutional, or
          policy conclusions are drawn.
        </p>

        <h2>Hidden Assumption Being Tested</h2>
        <p>
          UV-C sterilization inactivates all surface bacteria on exposed objects,
          regardless of object geometry or shadowing.
        </p>

        <h2>What Might Be True Instead</h2>
        <p>
          Bacteria may survive in regions that are physically shadowed from UV-C
          radiation, even when standard exposure parameters are used.
        </p>

        <h2>Test Objects</h2>
        <ul>
          <li>Matte stainless steel or plastic cube (5 cm × 5 cm × 5 cm)</li>
          <li>Matte stainless steel or plastic cylinder (5 cm diameter × 5 cm height)</li>
        </ul>

        <h2>UV Parameters</h2>
        <ul>
          <li>UV-C wavelength: 254 nm</li>
          <li>Intensity: 1.0 mW/cm² (verified at 20 cm)</li>
          <li>Exposure distance: 20 cm</li>
          <li>Exposure time: 10 minutes</li>
          <li>Ambient temperature: 21–25 °C</li>
        </ul>

        <h2>Sampling Locations</h2>
        <ol>
          <li>Directly exposed surface (top-facing UV source)</li>
          <li>Shadowed object surface (opposite UV source)</li>
          <li>Flat surface, unshadowed (no object obstruction)</li>
          <li>Flat surface, shadowed (behind object relative to lamp)</li>
        </ol>

        <h2>Biological Material</h2>
        <ul>
          <li>Non-spore-forming BSL-1 or BSL-2 <em>E. coli</em></li>
          <li>Overnight culture adjusted to ~10⁸ CFU/mL</li>
        </ul>

        <h2>Experimental Procedure</h2>
        <ol>
          <li>
            Clean all objects and surfaces with 70% ethanol and air-dry.
          </li>
          <li>
            Inoculate each sampling area (2 × 2 cm) with 10 μL bacterial
            suspension (~10⁶ CFU).
          </li>
          <li>Allow all inoculated areas to dry completely (~30 minutes).</li>
          <li>
            Arrange objects to produce reproducible geometric shadows relative
            to the UV source.
          </li>
          <li>
            Expose setup to UV-C for 10 minutes at fixed distance and intensity.
          </li>
          <li>
            After exposure, swab each inoculated area using sterile PBS-moistened
            swabs.
          </li>
          <li>
            Elute each swab in 1 mL sterile PBS and vortex briefly.
          </li>
          <li>
            Plate 100 μL (or appropriate dilution) on nutrient agar.
          </li>
          <li>Incubate plates at 37 °C for 24 hours.</li>
          <li>Count colony-forming units (CFU).</li>
        </ol>

        <h2>Controls</h2>
        <ul>
          <li>
            Positive control: Inoculated samples not exposed to UV-C
          </li>
          <li>
            Negative control: Uninoculated surfaces exposed to UV-C
          </li>
        </ul>

        <h2>Binary Falsification Condition</h2>
        <ul>
          <li>
            <strong>Pass:</strong> Zero detectable CFU on all shadowed and
            unshadowed surfaces after UV exposure.
          </li>
          <li>
            <strong>Fail:</strong> ≥1 CFU detected on any shadowed surface after
            UV exposure.
          </li>
        </ul>

        <h2>Confounders and Execution Constraints</h2>
        <ul>
          <li>UV intensity must not vary during exposure</li>
          <li>Objects must have matte (non-reflective) surfaces</li>
          <li>Shadow geometry must be verified before exposure</li>
          <li>Triplicate runs required for validity</li>
        </ul>

        <h2>Safety Boundaries</h2>
        <ul>
          <li>Operate UV-C sources with eye and skin protection</li>
          <li>Follow institutional biosafety procedures</li>
          <li>No human or animal testing involved</li>
        </ul>

        <h2>Scope Limitation</h2>
        <p>
          This experiment evaluates surface survival only under the defined
          geometry, organism, and UV conditions. It does not assess air
          sterilization, biofilms, or medical device sterility claims.
        </p>

        <hr />

        <p className="text-sm text-muted-foreground">
          Edge-of-Practice experiments are designed for direct execution and
          binary falsification. No extrapolation beyond measured outcomes is
          permitted.
        </p>
      </article>
    </main>
  );
}
