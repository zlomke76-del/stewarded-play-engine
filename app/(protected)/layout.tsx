// app/(protected)/layout.tsx

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = headers();
  const cookieHeader = headerStore.get("cookie") ?? "";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 🔒 READ-ONLY in layout
        get(name: string) {
          const match = cookieHeader.match(
            new RegExp(`${name}=([^;]+)`)
          );
          return match?.[1];
        },
        set() {
          // 🚫 Layouts must not mutate cookies
        },
        remove() {
          // 🚫 Layouts must not mutate cookies
        },
      },
    }
  );

  // 1️⃣ Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // 2️⃣ Entitlement check (NO TRY MODE)
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_subscription")
    .eq("id", user.id)
    .single();

  if (!profile?.active_subscription) {
    redirect("/subscribe");
  }

  return <>{children}</>;
}
