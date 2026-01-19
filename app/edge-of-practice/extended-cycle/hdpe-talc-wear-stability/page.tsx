import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — Wear Stability in HDPE/Talc Systems | Moral Clarity AI",
  description:
    "Tests whether untreated talc platelets induce self-stabilizing low-shear planes under extended sliding.",
  robots: { index: true, follow: true },
};

export default function HDPETalcWearPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Self-Stabilizing Wear Behavior in HDPE via Untreated Talc Platelets</h1>

        <h2>Assumption under test</h2>
        <p>
          Unmodified fillers worsen long-term friction and wear behavior in polyethylene.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Mold HDPE containing 10 wt% untreated talc. Subject samples to continuous pin-on-disk
          sliding over 2–4 weeks while tracking friction coefficient drift.
        </p>

        <h2>Failure condition</h2>
        <p>
          Increasing friction coefficient or debris accumulation exceeding neat HDPE.
        </p>

        <h2>Pass criterion</h2>
        <p>
          Stable or decreasing friction coefficient after ≥10<sup>4</sup> sliding cycles.
        </p>

        <hr />
        <p><em>Status:</em> Final · Mid-Cycle</p>
      </article>
    </main>
  );
}
