import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — Moisture Cycling Stability in Nylon/Graphite | Moral Clarity AI",
  description:
    "Tests whether graphite moderates moisture-driven stress during repeated absorption cycles.",
  robots: { index: true, follow: true },
};

export default function NylonGraphiteMoisturePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Moisture Cycling Stress Moderation in Nylon 6 via Graphite</h1>

        <h2>Assumption under test</h2>
        <p>
          Fillers worsen long-term moisture sensitivity in hygroscopic polymers.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Nylon 6 with 5 wt% graphite undergoes weekly wet/dry cycles for 12 weeks.
          Dimensional stability and crack formation are monitored.
        </p>

        <h2>Failure condition</h2>
        <p>
          Greater warpage, cracking, or modulus loss than neat nylon.
        </p>

        <h2>Pass criterion</h2>
        <p>
          Reduced dimensional drift or crack density relative to neat nylon.
        </p>

        <hr />
        <p><em>Status:</em> Final · Mid-Cycle</p>
      </article>
    </main>
  );
}
