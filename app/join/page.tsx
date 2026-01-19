// app/join/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Prevent prerendering — render client-side only
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

function JoinInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Joining…');

  useEffect(() => {
    (async () => {
      try {
        // ✅ strictNullChecks-safe access
        const token = searchParams?.get?.('token') ?? null;
        if (!token) {
          setMessage('Missing invite token.');
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const accessToken = session?.access_token;
        if (!accessToken) {
          router.replace(`/login?next=${encodeURIComponent(`/join?token=${token}`)}`);
          return;
        }

        // ✅ Correct Supabase Edge Functions URL
        const fnUrl = `${SUPABASE_URL}/functions/v1/join?token=${encodeURIComponent(token)}`;

        const res = await fetch(fnUrl, {
          method: 'POST',
          headers: {
            // ✅ Functions need apikey (anon) and user bearer if you check auth
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Try to read JSON; fall back to generic error if unexpected
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          /* ignore parse errors */
        }

        if (res.ok) {
          setMessage(data.message || 'Joined successfully.');
          // Optional: redirect on success
          // router.replace('/app');
        } else {
          setMessage(data.error || `Join failed (${res.status}).`);
        }
      } catch (err: any) {
        setMessage(err?.message || 'Unexpected error while joining.');
      }
    })();
  }, [router, searchParams]);

  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-4">Invite</h1>
      <p>{message}</p>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Invite</h1>
          <p>Preparing…</p>
        </main>
      }
    >
      <JoinInner />
    </Suspense>
  );
}
