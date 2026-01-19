"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";

export default function AuthShell() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // TypeScript-safe resolution
  const redirectTo = searchParams?.get("redirect") ?? "/app";

  const sendMagicLink = useCallback(async () => {
    if (!email) return;

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
            redirectTo
          )}`,
        },
      });

      if (error) {
        console.error("[AuthShell] signIn error", error);
        alert("Failed to send magic link.");
      } else {
        alert("Check your email for the sign-in link.");
      }
    } finally {
      setLoading(false);
    }
  }, [email, redirectTo]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>

      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
      />

      <button
        onClick={sendMagicLink}
        disabled={loading}
        className="rounded bg-yellow-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send Magic Link"}
      </button>
    </div>
  );
}
