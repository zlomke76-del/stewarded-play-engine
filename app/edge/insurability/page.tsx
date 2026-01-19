// ------------------------------------------------------------
// Edge of Insurability — Canonical Entry
// Immutable, publication-grade
// App Router | Next.js 16 SAFE
// ------------------------------------------------------------

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Edge of Insurability",
  description:
    "The objective boundary where artificial intelligence systems stop being experimental and become economically accountable.",
  openGraph: {
    title: "The Edge of Insurability",
    description:
      "Insurability defines the binary market boundary between experimental AI and economically accountable operation.",
    type: "article",
  },
};

export default function EdgeOfInsurabilityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <article className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            The Edge of Insurability
          </h1>
          <p className="text-sm text-neutral-500">
            Edge Framework · Insurability
          </p>
        </header>

        <section className="space-y-5 text-base leading-relaxed">
          <p>
            The insurability of artificial intelligence systems marks the
            objective boundary between experimental technology and economically
            accountable operation. Insurability, in this context, is not an
            ethical position nor a function of regulatory compliance. It is a
            market determination—established strictly by the presence or absence
            of auditable risk controls, as required by insurers assuming exposure.
          </p>

          <p>
            Insurance functions as the primary enforcement mechanism for scalable
            accountability. Its role is precise: to transfer financial risk only
            where evidence of governance and control can be demonstrated to the
            satisfaction of risk carriers. The criterion is strictly binary. A
            system is either covered or uncovered. There is no intermediate
            recognition or partial status; absent proof, insurance does not
            attach.
          </p>

          <p>
            Capability is not evidence. The technical sophistication,
            adaptability, or historical performance of an AI system is
            irrelevant in the absence of documented control frameworks and
            verifiable risk management measures. Neither intent nor outcome
            creates or sustains coverage. Only independently auditable evidence
            of governance and operational discipline satisfies underwriting
            requirements.
          </p>

          <p>
            From the insurer’s perspective, governance that cannot be proven is
            functionally nonexistent. Stated procedures, internal assurances, or
            informal practices carry no weight unless they can be validated
            through independent review. This is not an interpretation—it is a
            structural feature of insurability as enforced by the market.
          </p>

          <p>
            Uninsured systems are not necessarily prohibited from continued
            operation. They may persist, transact, or even scale in certain
            environments. Their lack of insurability, however, represents
            unresolved economic exposure. The constraint imposed by the market
            is practical and absolute: where controls cannot be proven, financial
            risk cannot be transferred or distributed.
          </p>

          <p>
            This series will define the specific points at which AI systems lose
            insurability, detailing common evidence gaps and recurring failures
            in risk control. It will also clarify the nature, form, and
            sufficiency of evidence insurance markets require to grant or
            maintain coverage. The framework established here is fixed and serves
            as the reference point for all subsequent discussion of AI
            accountability through the lens of insurability.
          </p>
        </section>
      </article>
    </main>
  );
}
