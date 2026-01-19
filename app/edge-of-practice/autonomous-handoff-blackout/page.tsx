import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Irreversible Takeover Blackout Intervals in Autonomous Vehicle Handoffs | Moral Clarity AI",
  description:
    "Identifies a non-negotiable cognitive and temporal boundary during automation-to-human handoff in autonomous vehicles, beyond which safe intervention becomes physically impossible.",
  openGraph: {
    title: "Irreversible Takeover Blackout Intervals",
    description:
      "A constraint-first analysis of human takeover failure during autonomous vehicle handoff.",
    url: "https://moralclarity.ai/edge-of-practice/autonomous-handoff-blackout",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AutonomousHandoffBlackoutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Irreversible Takeover Blackout Intervals in Autonomous Vehicle Handoffs</h1>

        <p className="lead">
          Certain mixed-control autonomous driving systems impose a non-negotiable
          cognitive and temporal boundary during automation disengagement, beyond
          which human drivers cannot safely intervene—regardless of training,
          warnings, or intent.
        </p>

        <hr />

        <h2>What This Work Exposes</h2>

        <p>
          This entry identifies and formalizes the <strong>Takeover Blackout Interval (TBI)</strong>:
          a finite, irreducible time window immediately following automation
          disengagement during which a human driver is physiologically incapable
          of reconstructing situational context quickly enough to execute safe,
          corrective control.
        </p>

        <p>
          These blackout intervals are not edge cases, negligence, or design flaws.
          They arise from the interaction between automation-induced context loss
          and immutable human cognitive recovery limits.
        </p>

        <hr />

        <h2>Enforced Constraint</h2>

        <p>
          Reality enforces a hard boundary at the level of human cognitive
          state-reconstruction speed during autonomous vehicle handoff. Once
          automation disengagement coincides with insufficient time for context
          recovery, safe intervention becomes physically impossible.
        </p>

        <h3>Exact Scale Where the Boundary Is Enforced</h3>

        <p>
          <strong>Biological / cognitive / temporal.</strong> The limit is set by
          human perception, recognition, decision formation, and motor planning
          latency under surprise and compressed time.
        </p>

        <hr />

        <h2>Why Prevailing Approaches Fail</h2>

        <ul>
          <li>
            They assume human supervision is continuously recoverable.
          </li>
          <li>
            They treat takeover as an instantaneous or near-instantaneous event.
          </li>
          <li>
            They frame failure as behavioral (“driver inattention”) rather than
            physiological.
          </li>
          <li>
            They rely on alerts and warnings that cannot compress human recovery
            time below biological limits.
          </li>
        </ul>

        <p>
          These approaches buffer surface risk but do not—and cannot—remove the
          blackout interval.
        </p>

        <hr />

        <h2>What Practice Refuses to Admit</h2>

        <ul>
          <li>
            There exist handoff intervals where no human action can succeed.
          </li>
          <li>
            Longer automation engagement increases—not decreases—latent takeover risk.
          </li>
          <li>
            Responsibility assignment during TBIs is structurally incoherent.
          </li>
        </ul>

        <hr />

        <h2>Time Horizon</h2>

        <ul>
          <li>
            <strong>Scientific validity:</strong> Immediate
          </li>
          <li>
            <strong>Experimental confirmation:</strong> Short-cycle (weeks to months)
          </li>
          <li>
            <strong>Operational adoption:</strong> Long-term, politically resistant
          </li>
        </ul>

        <hr />

        <h2>Relation to Other Work</h2>

        <p>
          This constraint mirrors irreducible handoff failures documented in:
        </p>

        <ul>
          <li>
            <Link href="/edge-of-practice/irreversible-cognitive-dead-zones">
              Aviation automation handoffs
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/alarm-parsing-collapse-threshold">
              Automated medical alarm systems
            </Link>
          </li>
        </ul>

        <hr />

        <h2>Governance</h2>

        <p>
          This entry does not propose solutions, products, or regulatory changes.
          Its sole function is to surface an enforced boundary misclassified by
          existing safety narratives.
        </p>

        <p className="text-sm text-muted-foreground">
          Published as part of the <Link href="/edge-of-practice">Edge of Practice</Link>.
          Fixed at publication. Revision requires explicit versioning.
        </p>
      </article>
    </main>
  );
}
