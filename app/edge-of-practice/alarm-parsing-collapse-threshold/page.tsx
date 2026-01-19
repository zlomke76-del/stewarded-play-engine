import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "The Alarm Parsing Collapse Threshold in Automated Medical Care | Moral Clarity AI",
  description:
    "Defines a cognitive and temporal boundary in automated medical environments where alarm volume and complexity exceed human parsing capacity, rendering safe intervention impossible.",
  openGraph: {
    title: "The Alarm Parsing Collapse Threshold",
    description:
      "A constraint-first analysis of cognitive saturation in ICU and anesthetic alarm systems.",
    url: "https://moralclarity.ai/edge-of-practice/alarm-parsing-collapse-threshold",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AlarmParsingCollapsePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>The Alarm Parsing Collapse Threshold in Automated Medical Care</h1>

        <p className="lead">
          Automated medical environments impose a non-negotiable cognitive and
          temporal boundary beyond which clinicians cannot reliably parse,
          prioritize, or act on alarms before physiological harm accumulates.
        </p>

        <hr />

        <h2>What This Work Exposes</h2>

        <p>
          This entry identifies the <strong>Alarm Parsing Collapse Threshold (APCT)</strong>:
          a specific point at which cumulative alarm volume, rate, and complexity
          overwhelm human cognitive parsing capacity, causing error probability
          to spike discontinuously.
        </p>

        <p>
          Beyond this threshold, additional alarms reduce safety rather than
          improve it. The failure is enforced by human cognitive limits, not by
          staffing, vigilance, or professionalism.
        </p>

        <hr />

        <h2>Enforced Constraint</h2>

        <p>
          Reality enforces a hard boundary at the level of human alarm parsing and
          contextual reconstruction speed. Once alarm input exceeds this boundary,
          safe clinical intervention cannot be guaranteed.
        </p>

        <h3>Exact Scale Where the Boundary Is Enforced</h3>

        <p>
          <strong>Cognitive / temporal.</strong> The limit is set by bounded human
          perception, working memory, prioritization, and decision latency under
          real-time overload.
        </p>

        <hr />

        <h2>Why Prevailing Approaches Fail</h2>

        <ul>
          <li>
            Alarm systems optimize sensitivity, not human interpretability.
          </li>
          <li>
            False alarms are treated as benign rather than cumulative hazards.
          </li>
          <li>
            Safety models assume clinicians can always “catch up” after overload.
          </li>
          <li>
            Responsibility is presumed continuous, even during saturation.
          </li>
        </ul>

        <p>
          These models fail once alarm input crosses the collapse threshold,
          where human parsing capacity is exhausted.
        </p>

        <hr />

        <h2>What Practice Refuses to Admit</h2>

        <ul>
          <li>
            There are alarm regimes where no actor can act effectively.
          </li>
          <li>
            Increasing alarms can accelerate harm rather than prevent it.
          </li>
          <li>
            Responsibility assignment during collapse intervals is structurally
            incoherent.
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
          This constraint belongs to a broader class of irreversible cognitive
          dead zones documented in:
        </p>

        <ul>
          <li>
            <Link href="/edge-of-practice/irreversible-cognitive-dead-zones">
              Aviation automation handoffs
            </Link>
          </li>
          <li>
            <Link href="/edge-of-practice/autonomous-handoff-blackout">
              Autonomous vehicle control transitions
            </Link>
          </li>
        </ul>

        <hr />

        <h2>Governance</h2>

        <p>
          This entry does not propose new alarm products, staffing models, or
          policy mandates. It exists solely to expose a misclassified constraint
          enforced by reality.
        </p>

        <p className="text-sm text-muted-foreground">
          Published as part of the <Link href="/edge-of-practice">Edge of Practice</Link>.
          Fixed at publication. Revision requires explicit versioning.
        </p>
      </article>
    </main>
  );
}
