"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useSolaceMemory() {
  // Create Supabase client once per hook instance
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [memReady, setMemReady] = useState(false);
  const memoryCacheRef = useRef<any[]>([]);
  const [userKey, setUserKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function resolveIdentity() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user?.id) {
          setUserKey(session.user.id);
        } else {
          setUserKey(undefined);
        }
      } catch (err) {
        console.error("[useSolaceMemory] auth resolution failed", err);
        setUserKey(undefined);
      } finally {
        if (mounted) setMemReady(true);
      }
    }

    resolveIdentity();

    // Keep identity in sync (login / logout / refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUserKey(session?.user?.id);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    userKey,
    memReady,
    memoryCacheRef,
  };
}
