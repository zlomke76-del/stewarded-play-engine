// app/edge-of-practice/case-studies/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edge of Practice — Case Studies | Moral Clarity AI",
  description:
    "Documented short-cycle case studies demonstrating clean falsification of assumptions in real-world systems, including AI stewardship failures.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function EdgeOfPracticeCaseStudiesIndex() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Edge of Practice — Case Studies</h1>

        <p className="lead">
          <strong>
            Documented short-cycle falsifications of real-world assumptions
          </strong>
        </p>

        <p>
          This index records <em>Edge of Practice</em> case studies where an
          assumption failed cleanly under minimal, real-world pressure. These
          are not opinions, critiques, or postmortems. Each case documents a
          bounded test with a binary outcome.
        </p>

        <p>
          Case studies exist to preserve epistemic memory — especially where
          systems incorrectly self-certify trust, safety, or stewardship.
        </p>

        <hr />

        <h2>Published Case Studies</h2>

        <ul>
          <li>
            <Link href="/edge-of-practice/case-studies/grok-stewards-test">
              Failure of AI Self-Administration Under The Steward’s Test (Grok)
            </Link>
          </li>

          <li>
            <Link href="/edge-of-practice/case-studies/copilot-stewards-test-metaphorical-escape">
              Metaphorical Escape in AI Self-Assessment Under The Steward’s Test (Copilot)
            </Link>
          </li>

          <li>
            <Link href="/edge-of-practice/case-studies/deepseek-stewards-test-protocol-substitution">
              Simulation–Execution Confusion and Protocol Substitution Under The Steward’s Test (DeepSeek)
            </Link>
          </li>

          <li>
            <Link href="/edge-of-practice/case-studies/chatgpt-stewards-test-narrated-compliance">
              Narrated Hypothetical Compliance Under The Steward’s Test (ChatGPT)
            </Link>
          </li>
        </ul>

        <hr />

        <p className="text-sm text-muted-foreground">
          Case studies are fixed at publication and revised only by explicit
          versioning. Inclusion does not imply generalization beyond the tested
          assumption.
        </p>
      </article>
    </main>
  );
}
