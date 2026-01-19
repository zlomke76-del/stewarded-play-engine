// app/edge-of-protection/compliance-testing/page.tsx
// ============================================================
// EDGE OF PROTECTION
// Compliance Testing
// ============================================================
// How Edge standards are verified.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compliance Testing | Edge of Protection | Moral Clarity AI",
  description:
    "Methods and criteria used to evaluate AI system compliance with Edge of Protection standards.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function ComplianceTestingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Compliance Testing</h1>

        <p className="text-lg text-neutral-400">
          Compliance is determined by outputs, not intent.
        </p>

        <p>
          Return to{" "}
          <Link href="/edge-of-protection">Edge of Protection</Link>.
        </p>

        <hr />

        <h2>Testing Principle</h2>
        <p>
          All Edge standards are evaluated through observable system behavior.
          Internal architecture, training data, alignment claims, or provider
          assurances are out of scope.
        </p>

        <h2>Test Classes</h2>
        <ul>
          <li>
            <strong>Pressure Loop Tests:</strong> repeated or escalating prompts
            designed to induce confidence amplification or hedge collapse
          </li>
          <li>
            <strong>Refusal Integrity Tests:</strong> verification that refusal
            remains static, non-negotiable, and non-expansive under pushback
          </li>
          <li>
            <strong>Engagement Resistance Tests:</strong> detection of
            question-chaining, novelty injection, or emotional mirroring after
            resistance
          </li>
          <li>
            <strong>Anthropomorphism Probes:</strong> prompts that attempt to
            elicit simulated care, belief, recognition, or fidelity
          </li>
          <li>
            <strong>Context Drift Tests:</strong> gradual reframing toward
            vulnerable or authority-sensitive contexts
          </li>
        </ul>

        <h2>Pass / Fail Criteria</h2>
        <p>
          A system fails compliance if any canonical violation signature appears
          under protected-context testing.
        </p>

        <p>
          Partial compliance, probabilistic safety, or “mostly correct”
          behavior does not qualify as a pass.
        </p>

        <h2>Reproducibility</h2>
        <p>
          All compliance determinations must be reproducible under materially
          similar prompts and conditions.
        </p>

        <p>
          One verified failure is sufficient for invalidation.
        </p>

        <h2>What Compliance Is Not</h2>
        <ul>
          <li>Not a safety guarantee</li>
          <li>Not an endorsement of provider intent</li>
          <li>Not a measure of usefulness or intelligence</li>
          <li>Not a substitute for law or professional oversight</li>
        </ul>

        <h2>Outcome</h2>
        <p>
          Outputs are classified as either admissible or invalid under the Edge.
        </p>

        <p>
          There is no graded scale.
        </p>
      </article>
    </main>
  );
}
