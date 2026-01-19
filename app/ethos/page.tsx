// app/ethos/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ethos | Moral Clarity AI",
  description:
    "Our foundation: Truth, Reason, Stewardship, and Peace. The Ethos of Moral Clarity AI.",
};

export default function EthosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral">
      <h1>Our Ethos</h1>
      <p><strong>Last updated:</strong> October 14, 2025</p>

      <p>
        <strong>Moral Clarity AI exists to restore reason, protect conscience, and honor truth.</strong>
        This platform is designed as a sanctuary for thought. We do not sell your
        data, we do not track you across the web, and we do not train external
        AI models on your private content.
      </p>

      <p>
        Every decision we make is measured against four pillars:
        <strong> Truth, Reason, Stewardship, and Peace.</strong> If a feature
        erodes any of these, we do not ship it.
      </p>

      <h2>The Four Pillars</h2>
      <ul>
        <li><strong>Truth</strong> — Say what is real. Avoid manipulation and sensationalism.</li>
        <li><strong>Reason</strong> — Slow down, think clearly, decide wisely.</li>
        <li><strong>Stewardship</strong> — Treat attention, money, and data as entrusted resources.</li>
        <li><strong>Peace</strong> — Create calm by design. No noise, no bait.</li>
      </ul>

      <p>
        If you ever feel we’ve missed the mark, tell us at{" "}
        <a href="mailto:support@moralclarity.ai">support@moralclarity.ai</a>.
        Stewardship means listening.
      </p>
    </main>
  );
}
