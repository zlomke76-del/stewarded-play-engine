// app/health/MemoryHealthPanel.tsx
'use client';

import { useEffect, useState } from 'react';

type MemoryHealth = {
  ok: boolean;
  message: string;
  timestamps: { server: string };
  env: { hasSupabaseUrl: boolean; hasServiceRoleKey: boolean };
  stats: {
    totalUserMemories: number | null;
    totalClassifications: number | null;
    unclassifiedCount: number | null;
    byUserKey: Record<string, { memories: number }>;
    rpcError?: string | null;
  } | null;
};

export default function MemoryHealthPanel() {
  const [data, setData] = useState<MemoryHealth | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch('/api/memory-health', { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as MemoryHealth;
      setData(j);
    } catch (e: any) {
      setErr(e?.message ?? 'failed to load');
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const badge = (on: boolean, label: string) => (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2">
      <span className={`h-2.5 w-2.5 rounded-full ${on ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      <span className="text-sm opacity-90">{label}</span>
    </div>
  );

  return (
    <>
      {err && (
        <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-rose-200">
          Failed to load memory health: {err}
        </div>
      )}

      {!data && !err && <div className="opacity-70">Loading memory health…</div>}

      {data && (
        <>
          <div className="flex flex-wrap gap-3">
            {badge(data.ok, 'Memory pipeline')}
            {badge(!!data.env?.hasSupabaseUrl, 'SUPABASE_URL')}
            {badge(!!data.env?.hasServiceRoleKey, 'SERVICE_ROLE_KEY')}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide opacity-60">
                Total user_memories
              </div>
              <div className="mt-1 text-lg">
                {data.stats?.totalUserMemories ?? '—'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide opacity-60">
                Total classifications
              </div>
              <div className="mt-1 text-lg">
                {data.stats?.totalClassifications ?? '—'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide opacity-60">
                Unclassified (approx)
              </div>
              <div className="mt-1 text-lg">
                {data.stats?.unclassifiedCount ?? '—'}
              </div>
            </div>
          </div>

          {data.stats?.byUserKey && (
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
                Key user memory counts
              </div>
              <div className="space-y-1 text-sm">
                {Object.entries(data.stats.byUserKey).map(([key, v]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="opacity-80">{key}</span>
                    <span className="font-mono">{v.memories}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 text-xs opacity-70">
            {data.message}
            {data.stats?.rpcError && (
              <div className="mt-1 text-[11px] text-amber-300">
                RPC note: {data.stats.rpcError}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={load}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
            >
              Refresh
            </button>
            <a
              href="/api/memory-health"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
            >
              View JSON
            </a>
          </div>
        </>
      )}
    </>
  );
}
