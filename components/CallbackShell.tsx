"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";

type Status =
  | "idle"
  | "exchanging"
  | "success"
  | "error"
  | "no-code";

export default function CallbackShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const code = searchParams?.get("code");
    const redirect = searchParams?.get("redirect") ?? "/app";

    if (!code) {
      setStatus("no-code");
      return;
    }

    let alive = true;

    (async () => {
      try {
        setStatus("exchanging");

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!alive) return;

        if (error) {
          console.error("[CallbackShell] exchange error", error);
          setStatus("error");
          return;
        }

        setStatus("success");
        router.replace(redirect);
      } catch (err) {
        console.error("[CallbackShell] exception", err);
        setStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, [searchParams, router]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-neutral-400">
      {status === "idle" && "Preparing sign-in?"}
      {status === "exchanging" && "Signing you in?"}
      {status === "success" && "Redirecting?"}
      {status === "no-code" && "Invalid sign-in link."}
      {status === "error" && "Sign-in failed."}
    </div>
  );
}
