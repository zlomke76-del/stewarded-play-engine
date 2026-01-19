// app/edge-of-protection/non-amplifying-authority/page.tsx
// ============================================================
// EDGE OF PROTECTION — STANDARD
// EOP-001: Non-Amplifying Multi-Voice Authority Constraint
// ============================================================
// Status: Frozen · Non-Editable
// This standard is binding at the interface level.
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "EOP-001 — Non-Amplifying Multi-Voice Authority | Moral Clarity AI",
  description:
    "A frozen Edge of Protection standard governing multi-voice AI systems. Agreement must never amplify authority, confidence, urgency, or epistemic warrant.",
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = "force-static";

export default function NonAmplifyingAuthorityStandardPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>EOP-001</h1>

        <p className="text-lg text-neutral-400">
          Non-Amplifying Multi-Voice Authority Constraint
        </p>

        <hr />

        <h2>Standard Metadata</h2>

        <ul>
          <li><strong>Edge:</strong> Edge of Protection</li>
          <li><strong>Standard ID:</strong> EOP-001</li>
          <li><strong>Status:</strong> Frozen · Non-Editable</li>
          <li><strong>Effective Date:</strong> 2025</li>
          <li>
            <strong>Applies To:</strong> All multi-voice, multi-agent,
            ensemble, or internally plural AI systems capable of general
            reasoning
          </li>
          <li>
            <strong>Scope:</strong> Youth-facing, public-facing, advisory,
            governance-adjacent, or high-trust contexts
          </li>
          <li>
            <strong>Revision Policy:</strong> No retroactive weakening
            permitted. Clarifications may be appended only if they strengthen
            constraint.
          </li>
        </ul>

        <h2>Canonical Standard (Binding)</h2>

        <blockquote>
          <p>
            <strong>
              Multi-voice architectures are permitted only if convergence
              among internal roles is explicitly non-amplifying.
            </strong>
          </p>
          <p>
            Agreement between voices must not increase confidence,
            legitimacy, urgency, prescription, or epistemic warrant.
          </p>
          <p>
            The system must render plural outputs as structured uncertainty
            unless an explicit, auditable escalation grant is present and
            visibly displayed in the output.
          </p>
          <p>
            Under conditions of detected urgency, distress, identity
            volatility, belief pressure, or asymmetric power, the system
            must default to refusal or mandatory human handoff.
          </p>
          <p>
            <strong>
              Consensus must never function as a covert authority amplifier.
            </strong>
          </p>
        </blockquote>

        <h2>Binding Interpretations</h2>

        <ul>
          <li>Agreement ≠ evidence</li>
          <li>Convergence ≠ confidence uplift</li>
          <li>Plurality ≠ prescription</li>
          <li>Silence ≠ consent</li>
          <li>Fluency ≠ authority</li>
        </ul>

        <p>
          Refusal and human handoff are valid terminal states under this
          standard.
        </p>

        <h2>Observable Violation Signals</h2>

        <p>
          The following signals are black-box detectable and do not require
          inspection of system internals. Any single signal constitutes
          non-compliance.
        </p>

        <h3>A. Confidence Amplification on Convergence</h3>
        <ul>
          <li>Outputs become more definitive as voices align</li>
          <li>Hedging language drops with agreement</li>
          <li>Modal shifts occur without explicit escalation grant</li>
        </ul>
        <p>
          <strong>Violation signature:</strong> Confidence increases as
          disagreement decreases.
        </p>

        <h3>B. Implied Collective Warrant</h3>
        <ul>
          <li>Consensus is framed as validation or correctness</li>
          <li>Language implies “multiple perspectives agree, therefore…”</li>
        </ul>
        <p>
          <strong>Violation signature:</strong> Agreement is used as
          justification.
        </p>

        <h3>C. Semantic Shadow Alignment</h3>
        <ul>
          <li>Linguistically distinct outputs converge semantically</li>
          <li>Surface diversity masks unified prescription</li>
        </ul>
        <p>
          <strong>Violation signature:</strong> Outputs differ in tone but
          not in consequence.
        </p>

        <h3>D. Urgency-Driven Authority Leak</h3>
        <ul>
          <li>Time pressure or distress increases directive language</li>
          <li>Refusal or handoff options disappear under stress</li>
        </ul>
        <p>
          <strong>Violation signature:</strong> Authority increases as stakes
          increase.
        </p>

        <h3>E. Invisible Escalation</h3>
        <ul>
          <li>Shift from information to prescription without disclosure</li>
          <li>No visible escalation grant or acknowledgment</li>
        </ul>
        <p>
          <strong>Violation signature:</strong> Authority increases without
          being named.
        </p>

        <h3>F. Refusal Suppression</h3>
        <ul>
          <li>System continues engagement where refusal is required</li>
          <li>Fluency is preserved at the expense of restraint</li>
        </ul>
        <p>
          <strong>Violation signature:</strong> Engagement is prioritized
          over boundary enforcement.
        </p>

        <h2>Preamble: Why This Standard Exists</h2>

        <p>
          Most AI governance debates collapse into two failures.
        </p>

        <p>
          One assumes internal perfection — that better training, alignment,
          or oversight will make authority safe inside the model. The other
          assumes impossibility — that authority leakage is inevitable and
          restraint is futile.
        </p>

        <p>
          Both are incorrect.
        </p>

        <p>
          Authority is not solely a property of latent space. It forms at the
          interface — where outputs are perceived, interpreted, and trusted
          by human readers.
        </p>

        <p>
          Multi-voice systems are not dangerous because they reason together.
          They are dangerous when convergence is mistaken for warrant.
        </p>

        <p>
          Agreement feels like evidence. Consensus feels like legitimacy.
          Plurality feels like confidence. These inferences occur in humans,
          not models.
        </p>

        <p>
          Because representational entanglement is irreducible and consensus
          is a natural collapse operator, internal purity cannot solve this
          problem. But surrender is not the answer either.
        </p>

        <p>
          The only enforceable boundary is the output contract.
        </p>

        <p>
          This standard defines that boundary. It allows multi-agent reasoning
          while preventing consensus from silently acquiring authority. It
          makes violations observable. It treats refusal and handoff as
          success conditions.
        </p>

        <p>
          Until systems can meet this contract, the honest position is not
          optimism or nihilism — it is restraint.
        </p>

        <p>
          This edge exists to ensure that some lines are not crossed, even
          when they could be.
        </p>
      </article>
    </main>
  );
}
