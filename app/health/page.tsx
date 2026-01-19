// app/health/page.tsx
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

import HealthPanel from './HealthPanel';
import MemoryHealthPanel from './MemoryHealthPanel';

export default function HealthPage() {
  // Server component: renders the shell and mounts client islands
  // that do the live polling / rendering.
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
          <p className="mt-1 text-sm opacity-70">
            Live status pulled from <code className="opacity-80">/api/health</code> and{' '}
            <code className="opacity-80">/api/memory-health</code>.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide opacity-70">
            Core Backend
          </h2>
          <HealthPanel />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide opacity-70">
            Memory Pipeline
          </h2>
          <MemoryHealthPanel />
        </section>
      </div>
    </main>
  );
}
