// client/components/Quota.tsx
'use client';

import { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient';

type CapRow = { value: number | null; updated_at: string | null };

export default function Quota() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [memoryMb, setMemoryMb] = useState<number | null>(null);
  const [canWrite, setCanWrite] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) who’s logged in?
        const { data: userResp, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const user = userResp.user ?? null;

        setEmail((user?.email as string | undefined) ?? null);

        // 2) read current memory cap from user_caps (fallback to 1024MB if none)
        if (user?.id) {
          const { data, error } = await supabase
            .from('user_caps')
            .select('value, updated_at')
            .eq('user_id', user.id)
            .eq('cap', 'memory_quota_mb')
            .limit(1)
            .maybeSingle<CapRow>();

          if (error) throw error;

          const mb = (data?.value ?? 1024) as number;
          setMemoryMb(mb);

          // 3) can this user still add memory? (your RPC)
          const { data: canData, error: canErr } = await supabase.rpc('can_add_memory', { uid: user.id });
          if (canErr) throw canErr;
          setCanWrite(typeof canData === 'boolean' ? canData : null);
        } else {
          // logged out view
          setMemoryMb(1024);
          setCanWrite(true);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading quota…</div>;
  }

  if (err) {
    return <div className="text-sm text-red-600">Quota error: {err}</div>;
  }

  return (
    <div className="text-sm text-gray-800 flex items-center gap-3">
      {email ? <span className="text-gray-500">{email}</span> : <span className="text-gray-500">Guest</span>}
      <span className="px-2 py-1 rounded bg-gray-100 border">Memory cap: <b>{memoryMb} MB</b></span>
      {canWrite !== null && (
        <span
          className={`px-2 py-1 rounded border ${
            canWrite ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}
        >
          {canWrite ? 'Within limit' : 'Free limit reached'}
        </span>
      )}
    </div>
  );
}
