import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Stewardship Canon | Moral Clarity AI",
  description:
    "A foundational doctrine defining responsible action in a post-experimental civilization where irreversibility, uncertainty, and scale dominate.",
  openGraph: {
    title: "The Stewardship Canon",
    description:
      "A framework for responsible action when experimentation, reversal, and centralized control no longer suffice.",
    url: "https://moralclarity.ai/stewardship-canon",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function StewardshipCanonPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>The Stewardship Canon</h1>

        <p className="lead">
          A framework for responsible action in a post-experimental civilization
        </p>

        <hr />

        <h2>Preamble</h2>
        <p>
          Humanity has entered an era in which many of its most consequential
          actions are no longer experiments. They are irreversible interventions
          into shared systems whose full dynamics cannot be known in advance and
          cannot be cleanly corrected after the fact.
        </p>

        <p>
          In this condition, responsibility cannot be grounded in prediction,
          optimization, authority, or intent alone. It must be grounded in
          stewardship: the disciplined maintenance of shared viability under
          permanent uncertainty and accelerating power.
        </p>

        <p>
          The Stewardship Canon defines how action remains possible when
          experimentation, reversal, and centralized control no longer suffice.
        </p>

        <hr />

        <h2>I. The Core Failure Mode</h2>
        <p>
          The fundamental error of modern civilization is treating irreversible,
          large-scale collective action as if it were an experiment—proceeding as
          though consequences are knowable, reversible, and subject to later
          correction.
        </p>

        <p>
          In reality, each such action irreversibly alters a shared world beyond
          the comprehension or control of any individual, institution, or model.
        </p>

        <h2>II. The Non-Negotiable Shift</h2>
        <p>
          Decision-making must move from seeking optimal or maximal outcomes to
          making <strong>bounded, provisional commitments under explicit
          uncertainty</strong>.
        </p>

        <p>
          Actions are not final solutions. They are enduring responsibilities
          undertaken within systems whose stability cannot be guaranteed.
        </p>

        <p>Stewardship replaces mastery.</p>

        <h2>III. The New Unit of Responsibility</h2>
        <p>
          Responsibility no longer resides primarily in individuals or
          centralized authorities.
        </p>

        <p>
          It is carried by <strong>overlapping, adaptive collectives</strong>:
          groups, practices, and embedded networks that continuously monitor,
          signal, and constrain one another.
        </p>

        <p>
          Moral action emerges from reciprocal vigilance and correction, not
          isolated virtue or singular command.
        </p>

        <h2>IV. The Constraint That Replaces Optimization</h2>
        <p>
          Optimization must be permanently subordinated to constraint.
        </p>

        <p>
          Every action must be bounded in advance by limits designed to prevent
          <strong> cascading, unrecoverable harm</strong>, regardless of
          incentives, momentum, partial knowledge, or perceived benefit.
        </p>

        <p>What cannot be safely constrained must not be pursued.</p>

        <h2>V. What This Makes Possible</h2>
        <p>
          Within this framework, progress remains possible—but it takes a
          different form.
        </p>

        <p>Progress becomes the stabilization of:</p>
        <ul>
          <li>resilient patterns</li>
          <li>cooperative feedback loops</li>
          <li>distributed safeguards</li>
          <li>adaptive practices that preserve livability over time</li>
        </ul>

        <p>
          Improvement is measured not by scale, speed, or dominance, but by
          continuity, adaptability, and sustained coexistence.
        </p>

        <h2>VI. What Must Be Permanently Abandoned</h2>
        <p>
          To act responsibly at irreversible scale, humanity must relinquish:
        </p>

        <ul>
          <li>the pursuit of comprehensive control</li>
          <li>the expectation of absolute certainty</li>
          <li>the belief in fully reversible trial-and-error</li>
          <li>the assumption of clear causal attribution after harm</li>
          <li>
            the notion that individual or institutional rectitude alone is
            sufficient
          </li>
          <li>the drive for unbounded expansion or unchecked efficiency</li>
        </ul>

        <p>
          These ambitions are no longer compatible with shared survival.
        </p>

        <h2>Closing Orientation</h2>
        <p>
          The Stewardship Canon does not promise safety, control, or redemption.
        </p>

        <p>It offers a discipline.</p>

        <p>
          Responsibility is grounded not in hope for mastery or reversal, but in
          a commitment to <strong>limit harm, preserve viability, and sustain
          common life</strong>—especially when certainty, authority, and
          consensus are unavailable.
        </p>

        <p>This is the condition of our time.</p>
        <p>Stewardship is how action remains possible within it.</p>

        <hr />

        <p className="text-sm text-muted-foreground">
          <em>Status:</em> Canonical · Immutable
          <br />
          <em>Revision policy:</em> The Canon is fixed. Interpretations may
          evolve; the text does not.
        </p>
      </article>
    </main>
  );
}
