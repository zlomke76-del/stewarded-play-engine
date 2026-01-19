"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ChatUI() {
  const [userId, setUserId] = useState<string | null>(null);

  // Create Supabase client once per component instance
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let cancelled = false;

    async function resolveUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error) return;

        setUserId(data.user?.id ?? null);
      } catch {
        // Silent fail — UI must not block on auth
      }
    }

    resolveUser();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div>
      {userId ? (
        <p>User authenticated</p>
      ) : (
        <p>Not signed in</p>
      )}
    </div>
  );
}
