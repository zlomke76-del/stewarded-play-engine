// app/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Moral Clarity AI",
  description:
    "Clear, plain-language terms that reflect Moral Clarity AI’s pillars: Truth, Reason, Stewardship, and Peace.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral">
      <h1>Terms of Use</h1>
      <p><strong>Last updated:</strong> October 14, 2025</p>

      <p>
        By using Moral Clarity AI you agree to these Terms and our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. The service</h2>
      <p>
        Moral Clarity AI provides tools for inquiry, reflection, decision-making,
        and team/ministry collaboration: Ask, Reflect, Projects, Reports, and Hub
        features.
      </p>

      <h2>2. Accounts &amp; roles</h2>
      <p>
        One person per seat. Roles: <strong>Steward</strong>,{" "}
        <strong>Co-Steward</strong>, <strong>Participant</strong> (and optional
        Guest). You are responsible for safeguarding access (2FA recommended;
        required for Stewards/Co-Stewards).
      </p>

      <h2>3. Subscriptions &amp; billing</h2>
      <p>
        Plans auto-renew monthly until canceled. Billing via Stripe; you can
        manage payment methods and cancellations in the Portal. If payment fails,
        we apply a gentle dunning cadence (day 0/3/7), after which your
        workspace may become read-only until resolved.
      </p>

      <h2>4. Ministries and 10% support</h2>
      <p>
        10% support flows only to <strong>active</strong> Ministries on a
        current plan. If a parishioner selects a church that is not yet active,
        funds accrue in escrow for up to <strong>6 months</strong>. If the
        church activates within that window, escrow applies to the first
        invoices. Otherwise, escrow converts: <strong>80%</strong> to the
        Scholarship &amp; Stewardship Fund and <strong>20%</strong> retained as
        operational margin. See the Privacy Policy for disclosures.
      </p>

      <h2>5. Intellectual property</h2>
      <p>
        You own your content. We own the platform, templates, and brand assets.
        You grant us a limited license to host and process your content only to
        operate the service.
      </p>

      <h2>6. Acceptable use</h2>
      <p>
        Follow the <a href="/aup">Acceptable Use Policy</a>. No illegal content,
        harassment, or attempts to breach security. No scraping, reverse
        engineering, or automated misuse.
      </p>

      <h2>7. AI guidance</h2>
      <p>
        Outputs may be imperfect. You are responsible for decisions made using
        outputs. For medical, legal, or financial decisions, consult qualified
        professionals.
      </p>

      <h2>8. Data exports &amp; deletion</h2>
      <p>
        You can export your data (including Clarity Reports) and request
        deletion. Deletion removes active data promptly and schedules backups for
        purge within standard retention windows.
      </p>

      <h2>9. Termination</h2>
      <p>
        We may suspend or terminate for material violations. You may cancel
        anytime; access continues through the paid period unless otherwise
        stated.
      </p>

      <h2>10. Disclaimers &amp; limitation of liability</h2>
      <p>
        Service is provided “as is.” To the maximum extent permitted by law, we
        are not liable for indirect or consequential damages. Our total liability
        is limited to the amounts you paid in the prior 12 months.
      </p>

      <h2>11. Governing law &amp; venue</h2>
      <p>
        Texas law governs these Terms, without regard to conflicts principles.
        Venue and jurisdiction: state or federal courts in Texas.
      </p>

      <h2>12. Changes to Terms</h2>
      <p>
        We may update Terms; material changes will be communicated via a{" "}
        <em>Clarity Moment</em> banner and/or email.
      </p>

      <p>
        Contact: <a href="mailto:support@moralclarity.ai">support@moralclarity.ai</a>
      </p>
    </main>
  );
}
