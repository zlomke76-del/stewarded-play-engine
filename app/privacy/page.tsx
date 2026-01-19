// app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Moral Clarity AI",
  description:
    "We collect only what we need to run Moral Clarity AI. We do not sell data or train external AI models on your private content.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> October 14, 2025</p>

      <p>
        We collect only what we need to run Moral Clarity AI, improve the
        experience, and comply with the law. We <strong>do not</strong> sell
        personal data. We <strong>do not</strong> use your private content to
        train external AI models. You control your data: export or delete at
        any time.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Moral Clarity AI (“we,” “us,” “our”) operates under{" "}
        <em>Tex Axes Entertainment</em> (DBA “Moral Clarity AI”) during our
        interim phase. Contact: <a href="mailto:support@moralclarity.ai">support@moralclarity.ai</a>.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>
          <strong>Account &amp; Identity:</strong> name, email, role,
          organization (family/business/ministry).
        </li>
        <li>
          <strong>Content you create:</strong> reflections, messages, projects,
          files, decision briefs, reports.
        </li>
        <li>
          <strong>Billing:</strong> processed by Stripe; we receive subscription
          status and invoices, not card numbers.
        </li>
        <li>
          <strong>Technical:</strong> device/browser info, IP (for security),
          timestamps, limited cookies (session/security).
        </li>
        <li>
          <strong>Support:</strong> messages and attachments you send to our
          help desk.
        </li>
      </ul>

      <h2>3. Why we collect it</h2>
      <ul>
        <li>Provide and secure the service (auth, sessions, permissions, fraud prevention).</li>
        <li>Improve reliability and usability (aggregate analytics only; opt-in for product analytics).</li>
        <li>Billing and account administration.</li>
        <li>Legal compliance and enforcement of our Terms.</li>
      </ul>

      <h2>4. What we never do</h2>
      <ul>
        <li>We do <strong>not</strong> sell or rent your personal data.</li>
        <li>We do <strong>not</strong> train external AI models on your private content.</li>
        <li>We do <strong>not</strong> run third-party advertising or trackers.</li>
      </ul>

      <h2>5. How we process and secure data</h2>
      <ul>
        <li>Encryption in transit (TLS 1.2+) and at rest (AES-256).</li>
        <li>Short-lived, presigned download links with access checks on every request.</li>
        <li>Row-level security to isolate organizations (tenants).</li>
        <li>Audit logs for critical actions (invites, revocations, exports, shares).</li>
        <li>Daily encrypted backups with periodic restore tests.</li>
      </ul>

      <h2>6. Your choices &amp; rights</h2>
      <ul>
        <li><strong>Access/Update:</strong> edit your profile, email, and settings at any time.</li>
        <li><strong>Portability:</strong> export your reflections, projects, and reports (Clarity Report).</li>
        <li><strong>Deletion:</strong> request deletion in Settings; backups are purged on schedule per retention.</li>
        <li><strong>Opt-outs:</strong> weekly digest emails, push notifications, optional analytics.</li>
        <li><strong>Founders Wall:</strong> opt-in only.</li>
      </ul>

      <h2>7. Data retention</h2>
      <ul>
        <li>Active accounts: retained while you use the service.</li>
        <li>Completed projects: cold storage at 12 months; deletion at 18 months (export available).</li>
        <li>Logs: 12 months.</li>
        <li>Lost-email recovery: 90 days for identity rebind after org seat revocation.</li>
        <li>Ministry escrow: held up to 6 months per the Escrow Policy (see Terms).</li>
      </ul>

      <h2>8. Sharing with third parties</h2>
      <ul>
        <li><strong>Processors:</strong> hosting, databases, email, error monitoring (bound by confidentiality and DPAs).</li>
        <li><strong>Payments:</strong> Stripe processes all payment data.</li>
        <li><strong>Legal:</strong> we may disclose if required by law, after reasonable review.</li>
      </ul>

      <h2>9. Children</h2>
      <p>
        Moral Clarity AI is not directed at children under 13. If you believe a
        child provided personal data, contact us to remove it.
      </p>

      <h2>10. International use</h2>
      <p>
        Data may be processed in the U.S. By using the service, you consent to
        U.S. processing.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We’ll post updates here and show a <em>Clarity Moment</em> banner for
        material changes.
      </p>

      <p>
        Contact: <a href="mailto:support@moralclarity.ai">support@moralclarity.ai</a>
      </p>
    </main>
  );
}
