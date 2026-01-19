"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Stats = {
  open_count: number;
  closed_count: number;
  high_open: number;
  medium_open: number;
  low_open: number;
  avg_first_reply_seconds: number | null;
};

function secondsToHMS(s?: number | null) {
  if (s == null) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = Math.floor(s % 60);
  return `${h}h ${m}m ${x}s`;
}

/** Singleton-ish browser client to play nice with Next HMR */
let _sb: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[LiveDashboard] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return null;
  }
  _sb = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _sb;
}

export default function LiveDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const supabase = useMemo(getSupabase, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/support/stats", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data: Stats = await res.json();
      if (mounted.current) setStats(data);
    } catch (e) {
      console.error("[LiveDashboard] load() failed:", e);
      if (mounted.current) setStats(null);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    load();

    // Realtime refresh on any change to public.support_requests
    if (!supabase) return () => { mounted.current = false; };

    const channel = supabase
      .channel("sr_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_requests" },
        () => load()
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") console.warn("[LiveDashboard] Realtime status:", status);
      });

    return () => {
      mounted.current = false;
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [supabase]);

  return (
    <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card label="Open" value={stats?.open_count} loading={loading} />
      <Card label="Closed" value={stats?.closed_count} loading={loading} />
      <Card label="High (open)" value={stats?.high_open} loading={loading} />
      <Card label="Med (open)" value={stats?.medium_open} loading={loading} />
      <Card
        label="Avg First Reply"
        value={secondsToHMS(stats?.avg_first_reply_seconds)}
        loading={loading}
      />
    </section>
  );
}

function Card({ label, value, loading }: { label: string; value: any; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-950">
      <div className="text-neutral-400 text-sm">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{loading ? "…" : value ?? "—"}</div>
    </div>
  );
}
