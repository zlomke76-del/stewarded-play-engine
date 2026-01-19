// app/aup/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | Moral Clarity AI",
  description:
    "Our Acceptable Use Policy ensures Moral Clarity AI remains a sanctuary for thought — lawful, humane, and secure.",
};

export default function AupPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral">
      <h1>Acceptable Use Policy</h1>
      <p><strong>Last updated:</strong> October 14, 2025</p>

      <p>
        We built Moral Clarity AI as a sanctuary for thought. Use it accordingly.
      </p>

      <h2>1) Be lawful and humane</h2>
      <p>
        No illegal content or activity. No harassment, hate, exploitation, or
        incitement.
      </p>

      <h2>2) Protect privacy</h2>
      <p>
        Do not upload confidential information you do not have the right to
        share. Respect others’ data and identity.
      </p>

      <h2>3) No abuse of the platform</h2>
      <p>
        No malware, phishing, spam, automated scraping, or attempts to bypass
        security. No load-testing without written permission.
      </p>

      <h2>4) Content boundaries</h2>
      <p>
        No sexually explicit content, graphic violence, or instructions to cause
        harm. No extremist propaganda or fundraising.
      </p>

      <h2>5) Integrity in teams and ministries</h2>
      <p>
        Act with clarity and charity. Do not impersonate others. Do not share
        organizational materials outside authorized channels.
      </p>

      <h2>6) Enforcement</h2>
      <p>
        We may warn, restrict, suspend, or terminate accounts that violate this
        AUP. For urgent concerns, contact{" "}
        <a href="mailto:support@moralclarity.ai">support@moralclarity.ai</a>.
      </p>
    </main>
  );
}
