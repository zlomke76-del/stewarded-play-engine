// app/help/page.tsx

export const metadata = {
  title: 'Help · Moral Clarity AI',
  description: 'How to get support and contact the team.',
  robots: { index: true, follow: true },
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Help & Support</h1>
        <p className="mt-2 text-sm opacity-75">
          Need a hand? Start here. For live system status, see{' '}
          <a href="/health" className="underline decoration-dotted underline-offset-4">/health</a>.
        </p>

        <section className="mt-8 grid gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-medium">Common actions</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm opacity-90">
              <li>Manage your subscription on the <a className="underline" href="/subscribe">Subscribe</a> page.</li>
              <li>Check recent changes on the <a className="underline" href="/journey">Journey</a> page.</li>
              <li>Review the <a className="underline" href="/privacy">Privacy</a> and <a className="underline" href="/terms">Terms</a>.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-medium">Contact support</h2>
            <p className="mt-2 text-sm opacity-90">
              Use the <a className="underline" href="/support">Support form</a> to open a ticket.
              You’ll receive an email confirmation with a ticket ID.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
