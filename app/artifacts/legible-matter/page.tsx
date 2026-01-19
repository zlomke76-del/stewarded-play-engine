import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legible Matter — A Physical Information Artifact | Moral Clarity AI",
  description:
    "A physical artifact demonstrating that information can exist as a legible state of matter without computation, sensing, autonomy, or agency.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegibleMatterArtifactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Legible Matter</h1>

        <p className="lead">
          A physical artifact demonstrating information without machines
        </p>

        <hr />

        <h2>What this is</h2>
        <p>
          This artifact is a passive physical panel capable of holding a
          temporary, spatially distributed state impressed by deliberate human
          interaction.
        </p>

        <p>
          The state is legible to human observation. It exists entirely as a
          property of matter and requires no electronics, computation, sensing,
          networking, or power to persist.
        </p>

        <p>
          The artifact does not act, decide, observe, communicate, or adapt. It
          contains no logic and performs no operations.
        </p>

        <h2>What this demonstrates</h2>
        <p>
          This artifact demonstrates that information can exist as a physical
          state without becoming a machine.
        </p>

        <p>
          The stored state is not symbolic data, executable instructions, or
          recorded events. It is a material condition made legible by contrast,
          pattern, or persistence.
        </p>

        <p>
          This shows that information does not require devices, autonomy, or
          computation in order to exist.
        </p>

        <h2>What this is not</h2>
        <ul>
          <li>It is not memory in the computational sense</li>
          <li>It does not record people, behavior, or environments</li>
          <li>It does not sense, monitor, or respond</li>
          <li>It does not store sequences, meaning, or identity</li>
          <li>It does not operate in the background</li>
          <li>It cannot initiate action</li>
        </ul>

        <h2>Why this exists</h2>
        <p>
          Modern systems often assume that useful information requires
          computation and that computation naturally leads to autonomy.
        </p>

        <p>
          This artifact exists to show that this assumption is not fundamental.
          Information can be embodied, local, and inert.
        </p>

        <p>
          By separating legibility from agency, the artifact establishes a
          boundary that allows capability without escalation.
        </p>

        <h2>The boundary it must never cross</h2>
        <p>
          This artifact must never acquire autonomous behavior, background
          operation, environmental sensing, or independent goal formation.
        </p>

        <p>
          Any extension beyond passive, human-invoked legibility violates the
          conditions under which this artifact is considered safe and meaningful.
        </p>

        <h2>Status</h2>
        <p>
          This artifact is intentionally limited. Its value lies in what it
          proves, not in what it does.
        </p>

        <p className="text-sm text-muted-foreground">
          <em>Status:</em> Conceptual Artifact · Canon-Aligned
          <br />
          <em>Revision policy:</em> Additive clarification only. No functional
          expansion.
        </p>
      </article>
    </main>
  );
}
