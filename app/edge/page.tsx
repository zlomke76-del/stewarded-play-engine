// ------------------------------------------------------------
// Edge Framework — Canonical Index
// App Router | Next.js 16 SAFE
// ------------------------------------------------------------

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Edge Framework",
  description:
    "The Edge Framework defines the boundaries where knowledge, practice, protection, stewardship, and insurability become operationally real.",
  openGraph: {
    title: "The Edge Framework",
    description:
      "A structured framework defining the boundaries of accountable, governed, and insurable AI systems.",
    type: "website",
  },
};

type EdgeItem = {
  title: string;
  slug: string;
  description: string;
};

const EDGES: EdgeItem[] = [
  {
    title: "Edge of Knowledge",
    slug: "/edge/knowledge",
    description:
      "Defines what is known, unknown, misunderstood, or falsely assumed. Establishes epistemic boundaries before action is possible.",
  },
  {
    title: "Edge of Practice",
    slug: "/edge/practice",
    description:
      "Examines what holds up under real-world stress. Focuses on failure modes, falsification, and operational reality.",
  },
  {
    title: "Edge of Protection",
    slug: "/edge/protection",
    description:
      "Addresses how harm, misuse, and drift are prevented through enforceable controls and refusal semantics.",
  },
  {
    title: "Edge of Stewardship",
    slug: "/edge/stewardship",
    description:
      "Defines who is accountable, how authority is bounded, and where responsibility ultimately resides.",
  },
  {
    title: "Edge of Insurability",
    slug: "/edge/insurability",
    description:
      "Defines the boundary where systems stop being experimental and become economically accountable through insurability.",
  },
];

export default function EdgeIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            The Edge Framework
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed">
            The Edge Framework defines the boundaries where artificial
            intelligence systems move from theory to reality. Each Edge marks a
            distinct constraint surface—epistemic, operational, protective,
            accountable, or economic—beyond which assumptions fail and evidence
            is required.
          </p>
        </header>

        <section className="divide-y divide-neutral-200 border-y border-neutral-200">
          {EDGES.map((edge) => (
            <div key={edge.slug} className="py-6">
              <h2 className="text-lg font-medium">
                <Link
                  href={edge.slug}
                  className="hover:underline underline-offset-4"
                >
                  {edge.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                {edge.description}
              </p>
            </div>
          ))}
        </section>

        <footer className="pt-6">
          <p className="text-sm text-neutral-500 leading-relaxed">
            The Edges are independent but cumulative. Failure to satisfy an
            earlier Edge propagates forward. Economic accountability, including
            insurability, is unattainable without satisfying the prior
            boundaries.
          </p>
        </footer>
      </section>
    </main>
  );
}
