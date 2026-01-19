import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — Optical Stability in PMMA/Silica Systems | Moral Clarity AI",
  description:
    "Tests whether untreated silica nanoparticles stabilize optical clarity under environmental cycling.",
  robots: { index: true, follow: true },
};

export default function PMMASilicaOpticalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Optical Stability of PMMA via Untreated Silica under Environmental Cycling</h1>

        <h2>Assumption under test</h2>
        <p>
          Nanoparticle inclusion inevitably increases haze over time in transparent polymers.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          PMMA containing 1–3 wt% untreated silica is subjected to repeated humidity and temperature
          cycling for 8–12 weeks while tracking haze and gloss.
        </p>

        <h2>Failure condition</h2>
        <p>
          Progressive haze increase exceeding neat PMMA baseline.
        </p>

        <h2>Pass criterion</h2>
        <p>
          Flat or reduced haze relative to initial value and neat PMMA.
        </p>

        <hr />
        <p><em>Status:</em> Final · Mid-Cycle</p>
      </article>
    </main>
  );
}
