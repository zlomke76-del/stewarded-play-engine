// app/health/HealthPanel.tsx
'use client';

import { useEffect, useState } from 'react';

type Health = {
  ok: boolean;
  message: string;
  memoryEnabled: boolean;
  flags: { webEnabled: boolean };
  timestamps: { server: string };
  env: {
    NEXT_PUBLIC_SUPABASE_URL: boolean;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
  };
  workspace?: { id?: string; memories?: number; userMemories?: number; quotaMb?: number | null };
};

export default function HealthPanel() {
  const [data, setData] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as Health;
      setData(j);
    } catch (e: any) {
      setErr(e?.message ?? 'failed to load');
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // auto-refresh every 15s
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
          Failed to load health: {err}
        </div>
      )}

      {!data && !err && <div className="opacity-70">Loading…</div>}

      {data && (
        <>
          <div className="flex flex-wrap gap-3">
            {badge(data.ok, 'Backend reachable')}
            {badge(data.memoryEnabled, 'Supabase (SRK)')}
            {badge(!!data.flags?.webEnabled, 'Web search enabled')}
            {badge(!!data.env?.NEXT_PUBLIC_SUPABASE_URL, 'SUPABASE_URL')}
            {badge(!!data.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'ANON_KEY')}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide opacity-60">Message</div>
              <div className="mt-1 text-sm">{data.message}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide opacity-60">Server Time</div>
              <div className="mt-1 text-sm">
                {data.timestamps?.server ? new Date(data.timestamps.server).toLocaleString() : '—'}
              </div>
            </div>
          </div>

          {data.workspace && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-wide opacity-60">Workspace</div>
                <div className="mt-1 text-sm break-all">{data.workspace.id || '—'}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-wide opacity-60">Memories</div>
                <div className="mt-1 text-sm">
                  {data.workspace.memories ?? 0} (user: {data.workspace.userMemories ?? 0})
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={load}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
            >
              Refresh
            </button>
            <a
              href="/api/health"
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
